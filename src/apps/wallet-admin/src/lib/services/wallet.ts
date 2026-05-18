/* eslint-disable camelcase */
import { EnvironmentConfig } from '~/config'
import { xhrDeleteAsync, xhrGetAsync, xhrPatchAsync, xhrPostAsync } from '~/libs/core'
import { postAsyncWithBlobHandling } from '~/libs/core/lib/xhr/xhr-functions/xhr.functions'

import { WalletDetails } from '../models/WalletDetails'
import {
    PaymentEngagementDetails,
    Winning,
    WinningDetail,
    WinningPaymentDetails,
    WinningsType,
} from '../models/WinningDetail'
import { TransactionResponse } from '../models/TransactionId'
import { PaginationInfo } from '../models/PaginationInfo'
import { WinningsAudit } from '../models/WinningsAudit'
import { PayoutAudit } from '../models/PayoutAudit'
import ApiResponse from '../models/ApiResponse'

const baseUrl = `${EnvironmentConfig.TC_FINANCE_API}`
const memberApiBaseUrl = `${EnvironmentConfig.API.V6}/members`
const engagementsApiBaseUrl = `${EnvironmentConfig.API.V6}/engagements/engagements`

interface EngagementAssignmentContextResponse {
    assignmentId: string
    durationMonths?: number | null
    engagementId: string
    engagementTitle: string
    otherRemarks?: string | null
    projectId: string
    projectName?: string
    ratePerHour?: string | null
    standardHoursPerWeek?: number | null
    startDate?: string | null
}

interface EngagementAssignmentResponse {
    durationMonths?: number | string | null
    id: number | string
    memberHandle?: string | null
    memberId?: number | string | null
    otherRemarks?: string | null
    ratePerHour?: string | null
    standardHoursPerWeek?: number | string | null
    startDate?: string | null
}

interface EngagementResponse {
    assignments?: EngagementAssignmentResponse[] | null
    id: number | string
    project?: {
        id?: number | string | null
        name?: string | null
    } | null
    projectId?: number | string | null
    projectName?: string | null
    title?: string | null
}

/**
 * Normalizes optional string-like API values into trimmed strings.
 *
 * @param value raw API field value.
 * @returns trimmed string when the value is present; otherwise `undefined`.
 * @remarks Used by wallet-admin payment-detail fallbacks to safely reuse
 * identifiers returned by finance and engagements APIs.
 */
function normalizeOptionalString(value: unknown): string | undefined {
    if (typeof value === 'string') {
        const trimmed = value.trim()
        return trimmed || undefined
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value)
    }

    return undefined
}

/**
 * Normalizes optional numeric API values into finite numbers.
 *
 * @param value raw API field value.
 * @returns finite number when present; otherwise `undefined`.
 * @remarks The finance and engagements APIs can return numeric fields as either
 * strings or numbers, so wallet-admin normalizes them before rendering.
 */
function normalizeOptionalNumber(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') {
        return undefined
    }

    const parsedValue = Number(value)
    return Number.isFinite(parsedValue) ? parsedValue : undefined
}

/**
 * Maps assignment-context API data into wallet-admin engagement details.
 *
 * @param context assignment context returned by the engagements API.
 * @returns wallet-admin engagement details for the payment modal.
 * @remarks This keeps the finance payment-details response contract stable even
 * when wallet-admin has to recover missing engagement metadata on the client.
 */
function mapAssignmentContextToEngagementDetails(
    context: EngagementAssignmentContextResponse,
): PaymentEngagementDetails {
    return {
        assignmentId: normalizeOptionalString(context.assignmentId),
        billingStartDate: normalizeOptionalString(context.startDate),
        durationMonths: normalizeOptionalNumber(context.durationMonths),
        engagementId: normalizeOptionalString(context.engagementId),
        engagementTitle: normalizeOptionalString(context.engagementTitle),
        otherRemarks: normalizeOptionalString(context.otherRemarks),
        projectId: normalizeOptionalString(context.projectId),
        projectName: normalizeOptionalString(context.projectName),
        ratePerHour: normalizeOptionalString(context.ratePerHour),
        standardHoursPerWeek: normalizeOptionalNumber(context.standardHoursPerWeek),
    }
}

/**
 * Finds the engagement assignment that best matches a wallet-admin payment row.
 *
 * @param assignments assignments returned by the engagements API.
 * @param winning payment row opened in wallet-admin.
 * @returns the matching assignment, or the only assignment when just one exists.
 * @remarks Wallet-admin may need to resolve details from either a stored
 * assignment ID, a winner ID, or the member handle shown in the payment table.
 */
function findMatchingEngagementAssignment(
    assignments: EngagementAssignmentResponse[] | null | undefined,
    winning: Winning,
): EngagementAssignmentResponse | undefined {
    if (!Array.isArray(assignments) || assignments.length === 0) {
        return undefined
    }

    const assignmentId = normalizeOptionalString(winning.assignmentId)
    if (assignmentId) {
        const assignmentMatch = assignments.find(assignment => (
            normalizeOptionalString(assignment.id) === assignmentId
        ))

        if (assignmentMatch) {
            return assignmentMatch
        }
    }

    const winnerId = normalizeOptionalString(winning.winnerId)
    if (winnerId) {
        const winnerMatch = assignments.find(assignment => (
            normalizeOptionalString(assignment.memberId) === winnerId
        ))

        if (winnerMatch) {
            return winnerMatch
        }
    }

    const winningHandle = normalizeOptionalString(winning.handle)
    const normalizedWinningHandle = winningHandle
        ? winningHandle.toLowerCase()
        : undefined

    if (normalizedWinningHandle) {
        const handleMatch = assignments.find(assignment => (
            normalizeOptionalString(assignment.memberHandle)
                ?.toLowerCase() === normalizedWinningHandle
        ))

        if (handleMatch) {
            return handleMatch
        }
    }

    return assignments.length === 1 ? assignments[0] : undefined
}

/**
 * Builds wallet-admin engagement details from an engagement record fallback.
 *
 * @param engagement engagement details returned by the engagements API.
 * @param winning payment row opened in wallet-admin.
 * @returns wallet-admin engagement details when the engagement can be mapped.
 * @remarks This fallback is used when finance cannot hydrate engagement details
 * but wallet-admin still has enough identifiers to recover them directly.
 */
function buildEngagementDetailsFromEngagement(
    engagement: EngagementResponse,
    winning: Winning,
): PaymentEngagementDetails | undefined {
    const engagementId = normalizeOptionalString(engagement.id)

    if (!engagementId) {
        return undefined
    }

    const assignment = findMatchingEngagementAssignment(engagement.assignments, winning)

    return {
        assignmentId: normalizeOptionalString(assignment?.id) || normalizeOptionalString(winning.assignmentId),
        billingStartDate: normalizeOptionalString(assignment?.startDate),
        durationMonths: normalizeOptionalNumber(assignment?.durationMonths),
        engagementId,
        engagementTitle: normalizeOptionalString(engagement.title),
        otherRemarks: normalizeOptionalString(assignment?.otherRemarks),
        projectId:
            normalizeOptionalString(engagement.projectId)
            || normalizeOptionalString(engagement.project?.id),
        projectName:
            normalizeOptionalString(engagement.projectName)
            || normalizeOptionalString(engagement.project?.name),
        ratePerHour: normalizeOptionalString(assignment?.ratePerHour),
        standardHoursPerWeek: normalizeOptionalNumber(assignment?.standardHoursPerWeek),
    }
}

export async function getWalletDetails(): Promise<WalletDetails> {
    const response = await xhrGetAsync<ApiResponse<WalletDetails>>(`${baseUrl}/wallet`)

    if (response.status === 'error') {
        throw new Error('Error fetching wallet details')
    }

    return response.data
}

export async function fetchAuditLogs(paymentId: string): Promise<WinningsAudit[]> {
    const response = await xhrGetAsync<ApiResponse<WinningsAudit[]>>(`${baseUrl}/admin/winnings/${paymentId}/audit`)

    if (response.status === 'error') {
        throw new Error('Error fetching audit logs')
    }

    return response.data

}

export async function fetchPayoutAuditLogs(paymentId: string): Promise<PayoutAudit[]> {
    // eslint-disable-next-line max-len
    const response = await xhrGetAsync<ApiResponse<PayoutAudit[]>>(`${baseUrl}/admin/winnings/${paymentId}/audit-payout`)

    if (response.status === 'error') {
        throw new Error('Error fetching audit logs')
    }

    if (response.data.length === 0) {
        throw new Error('No payout audit logs found')
    }

    return response.data

}

/**
 * Fetches wallet-admin payment details and repairs missing engagement metadata
 * with direct engagements API lookups when finance cannot enrich the response.
 *
 * @param winning payment row opened in wallet-admin.
 * @returns work-log details and, when recoverable, engagement details for the
 * payment modal.
 * @throws {Error} When the finance payment-details request returns an error.
 * @remarks Engagement payments can legitimately return only `workLog` when the
 * finance enrichment call fails. Wallet-admin retries those lookups with the
 * authenticated user so the modal still renders engagement details.
 */
export async function fetchWinningPaymentDetails(
    winning: Winning,
): Promise<WinningPaymentDetails> {
    const response = await xhrGetAsync<ApiResponse<WinningPaymentDetails>>(
        `${baseUrl}/admin/winnings/${winning.id}/payment-details`,
    )

    if (response.status === 'error') {
        throw new Error('Error fetching payment details')
    }

    const paymentDetails = response.data || {}

    if (
        winning.type.toLowerCase() !== 'engagement payment'
        || paymentDetails.engagementDetails
    ) {
        return paymentDetails
    }

    const assignmentLookupId
        = normalizeOptionalString(winning.assignmentId)
        || normalizeOptionalString(winning.externalId)

    if (assignmentLookupId) {
        try {
            const assignmentContext = await xhrGetAsync<EngagementAssignmentContextResponse>(
                `${engagementsApiBaseUrl}/assignments/${assignmentLookupId}/context`,
            )

            return {
                ...paymentDetails,
                engagementDetails: mapAssignmentContextToEngagementDetails(assignmentContext),
            }
        } catch {}
    }

    const engagementId = normalizeOptionalString(winning.externalId)

    if (!engagementId) {
        return paymentDetails
    }

    try {
        const engagement = await xhrGetAsync<EngagementResponse>(
            `${engagementsApiBaseUrl}/${engagementId}`,
        )
        const engagementDetails = buildEngagementDetailsFromEngagement(
            engagement,
            winning,
        )

        return engagementDetails
            ? {
                ...paymentDetails,
                engagementDetails,
            }
            : paymentDetails
    } catch {
        return paymentDetails
    }
}

export async function editPayment(updates: {
    winningsId: string,
    paymentStatus?: 'ON_HOLD_ADMIN' | 'OWED' | 'CANCELLED',
    paymentAmount?: number,
    releaseDate?: string,
}): Promise<string> {
    const body = JSON.stringify(updates)
    const url = `${baseUrl}/admin/winnings`

    const response = await xhrPatchAsync<string, ApiResponse<string>>(url, body)

    if (response.status === 'error') {
        if (response.error && response.error.message) {
            throw new Error(response.error.message)
        }

        throw new Error('Error editing payment')
    }

    return response.data
}

export async function exportSearchResults(
    filters: Record<string, string[]>,
    type: WinningsType = WinningsType.PAYMENT,
): Promise<Blob> {
    const url = `${baseUrl}/admin/winnings/export`

    const filteredFilters: Record<string, string | string[]> = {}

    for (const key in filters) {
        if (['categories'].includes(key)) {
            filteredFilters[key] = filters[key]
        } else if (filters[key].length > 0 && key !== 'pageSize') {
            filteredFilters[key] = filters[key][0]
        }
    }

    const payload: {
        winnerIds?: string[], [key: string]: string | number | string[] | undefined
    } = {
        ...filteredFilters,
        type,
    }

    if (filters.winnerIds && filters.winnerIds.length > 0) {
        payload.winnerIds = filters.winnerIds.map(id => id.toString())
    }

    const body = JSON.stringify(payload)

    try {
        return await postAsyncWithBlobHandling<string, Blob>(url, body, {
            responseType: 'blob',
        })
    } catch (err) {
        throw new Error('Failed to export search results')
    }
}

// eslint-disable-next-line max-len
export async function fetchWinnings(
    type: WinningsType,
    limit: number,
    offset: number,
    filters: Record<string, string[]>,
): Promise<{
    winnings: WinningDetail[],
    pagination: PaginationInfo
}> {
    const filteredFilters: Record<string, string | string[]> = {}

    for (const key in filters) {
        if (['categories'].includes(key)) {
            filteredFilters[key] = filters[key]
        } else if (filters[key].length > 0 && key !== 'pageSize') {
            filteredFilters[key] = filters[key][0]
        }
    }

    const payload: {
        limit: number, offset: number, winnerIds?: string[], [key: string]: string | number | string[] | undefined
    } = {
        limit,
        offset,
        ...filteredFilters,
        type,
    }

    if (filters.winnerIds && filters.winnerIds.length > 0) {
        payload.winnerIds = filters.winnerIds.map(id => id.toString())
    }

    const body = JSON.stringify(payload)

    const url = `${baseUrl}/admin/winnings/search`
    const response = await xhrPostAsync<string, ApiResponse<{
        winnings: WinningDetail[],
        pagination: PaginationInfo
    }>>(url, body)

    if (response.status === 'error') {
        throw new Error('Error fetching winnings')
    }

    if (response.data.winnings === null || response.data.winnings === undefined) {
        response.data.winnings = []
    }

    return response.data
}

export async function getPayments(
    limit: number,
    offset: number,
    filters: Record<string, string[]>,
): Promise<{
    winnings: WinningDetail[],
    pagination: PaginationInfo
}> {
    return fetchWinnings(WinningsType.PAYMENT, limit, offset, filters)
}

export async function getPoints(
    limit: number,
    offset: number,
    filters: Record<string, string[]>,
): Promise<{
    winnings: WinningDetail[],
    pagination: PaginationInfo
}> {
    return fetchWinnings(WinningsType.POINTS, limit, offset, filters)
}

export async function setPaymentProvider(
    type: string,
): Promise<TransactionResponse> {
    const body = JSON.stringify({
        details: {},
        setDefault: true,
        type,
    })

    const url = `${baseUrl}/user/payment-method`
    const response = await xhrPostAsync<string, ApiResponse<TransactionResponse>>(url, body)

    if (response.status === 'error') {
        throw new Error('Error setting payment provider')
    }

    return response.data
}

export async function confirmPaymentProvider(provider: string, code: string, transactionId: string): Promise<string> {
    const body = JSON.stringify({
        code,
        provider,
        transactionId,
    })

    const url = `${baseUrl}/payment-provider/paypal/confirm`
    const response = await xhrPostAsync<string, ApiResponse<string>>(url, body)

    if (response.status === 'error') {
        throw new Error('Error confirming payment provider')
    }

    return response.data
}

export async function getPaymentProviderRegistrationLink(type: string): Promise<TransactionResponse> {
    const url = `${baseUrl}/user/payment-method/${type}/registration-link`
    const response = await xhrGetAsync<ApiResponse<TransactionResponse>>(url)

    if (response.status === 'error') {
        throw new Error('Error getting payment provider registration link')
    }

    return response.data
}

export async function removePaymentProvider(type: string): Promise<TransactionResponse> {
    const url = `${baseUrl}/user/payment-method/${type}`
    const response = await xhrDeleteAsync<ApiResponse<TransactionResponse>>(url)

    if (response.status === 'error') {
        throw new Error('Error getting payment provider registration link')
    }

    return response.data
}

export async function getMemberHandle(userIds: string[]): Promise<Map<number, string>> {
    const BATCH_SIZE = 50

    const handleMap = new Map<number, string>()

    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
        const batch = userIds.slice(i, i + BATCH_SIZE)

        const url = `${memberApiBaseUrl}?userIds=[${batch.join(',')}]&fields=handle,userId`
        // eslint-disable-next-line no-await-in-loop
        const response = await xhrGetAsync<{ handle: string, userId: number }[]>(url)

        response.forEach(member => {
            handleMap.set(member.userId, member.handle)
        })
    }

    return handleMap
}
