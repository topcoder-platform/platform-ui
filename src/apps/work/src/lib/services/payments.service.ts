import {
    xhrGetAsync,
    xhrPostAsync,
} from '~/libs/core'

import {
    TC_FINANCE_API_URL,
} from '../constants'
import type {
    AssignmentPayment,
} from '../models'

import {
    fetchBillingAccountById,
} from './billing-accounts.service'
import {
    searchProfilesByUserIds,
} from './users.service'

const DEFAULT_ENGAGEMENT_PAYMENT_STATUS = 'ON_HOLD_ADMIN'

interface PaymentDetailsPayload {
    billingAccount: string
    currency: string
    grossAmount: number
    installmentNumber: number
    totalAmount: number
}

interface MemberPaymentPayload {
    attributes: {
        agreementRate?: number | string
        assignmentId: number | string
        memberHandle: string
        remarks: string
    }
    category: string
    description: string
    details: PaymentDetailsPayload[]
    externalId: string
    hoursWorked?: number
    origin: string
    status: string
    title: string
    type: string
    winnerId: string
}

interface PaymentsByAssignmentResponse {
    data?: AssignmentPayment[]
    result?: AssignmentPayment[]
}

function normalizeError(error: unknown, fallbackMessage: string): Error {
    const typedError = error as {
        message?: string
        response?: {
            data?: {
                message?: string
            }
        }
    }

    const message = typedError?.response?.data?.message
        || typedError?.message
        || fallbackMessage

    return new Error(message)
}

function normalizePaymentsResponse(response: unknown): AssignmentPayment[] {
    if (Array.isArray(response)) {
        return response
    }

    if (typeof response === 'object' && response) {
        const typedResponse = response as PaymentsByAssignmentResponse

        if (Array.isArray(typedResponse.data)) {
            return typedResponse.data
        }

        if (Array.isArray(typedResponse.result)) {
            return typedResponse.result
        }

        const nestedData = (typedResponse as {
            data?: {
                data?: AssignmentPayment[]
            }
        }).data?.data

        if (Array.isArray(nestedData)) {
            return nestedData
        }
    }

    return []
}

/**
 * Resolves creator handles for payment history rows when finance returns only
 * the creator user id.
 *
 * @param payments payment rows returned by the finance API.
 * @returns the original rows with `createdByHandle` hydrated when member data is available.
 *
 * @remarks Payment history remains usable even if the member lookup fails; in
 * that case this helper returns the original rows unchanged.
 *
 * @throws This helper does not raise exceptions.
 */
async function hydratePaymentCreatorHandles(
    payments: AssignmentPayment[],
): Promise<AssignmentPayment[]> {
    const creatorIds = Array.from(new Set(
        payments
            .map(payment => String(payment.createdBy || '')
                .trim())
            .filter(Boolean),
    ))

    if (!creatorIds.length) {
        return payments
    }

    try {
        const profiles = await searchProfilesByUserIds(creatorIds)
        const creatorHandlesByUserId = new Map(
            profiles
                .filter(profile => profile.handle)
                .map(profile => [profile.userId, profile.handle as string]),
        )

        return payments.map(payment => {
            const creatorId = String(payment.createdBy || '')
                .trim()
            const createdByHandle = creatorHandlesByUserId.get(creatorId)

            return createdByHandle
                ? {
                    ...payment,
                    createdByHandle,
                }
                : payment
        })
    } catch {
        return payments
    }
}

/**
 * Hydrates payment details with billing account names for payment history rows.
 *
 * @param payments payment rows returned by the finance API.
 * @returns the original rows with `details[].billingAccountName` added when a
 * billing account lookup succeeds.
 *
 * @remarks Lookup failures are ignored so payment history can still display
 * the stored BA ID returned by finance.
 *
 * @throws This helper does not raise exceptions.
 */
async function hydratePaymentBillingAccountNames(
    payments: AssignmentPayment[],
): Promise<AssignmentPayment[]> {
    const billingAccountIds = Array.from(new Set(
        payments
            .flatMap(payment => payment.details || [])
            .map(detail => String(detail.billingAccount || '')
                .trim())
            .filter(Boolean),
    ))

    if (!billingAccountIds.length) {
        return payments
    }

    const billingAccountNamesById = new Map<string, string>()

    await Promise.all(billingAccountIds.map(async billingAccountId => {
        try {
            const billingAccount = await fetchBillingAccountById(billingAccountId)
            const billingAccountName = String(billingAccount.name || '')
                .trim()

            if (billingAccountName) {
                billingAccountNamesById.set(billingAccountId, billingAccountName)
            }
        } catch {
            // Keep payment history usable even when a billing-account lookup fails.
        }
    }))

    if (!billingAccountNamesById.size) {
        return payments
    }

    return payments.map(payment => {
        if (!payment.details?.length) {
            return payment
        }

        let changed = false
        const details = payment.details.map(detail => {
            if (detail.billingAccountName) {
                return detail
            }

            const billingAccountId = String(detail.billingAccount || '')
                .trim()
            const billingAccountName = billingAccountNamesById.get(billingAccountId)

            if (!billingAccountName) {
                return detail
            }

            changed = true

            return {
                ...detail,
                billingAccountName,
            }
        })

        return changed
            ? {
                ...payment,
                details,
            }
            : payment
    })
}

export async function createMemberPayment(
    assignmentId: number | string,
    memberId: number | string,
    memberHandle: string,
    title: string,
    remarks: string,
    rate: number | string,
    amount: number | string,
    hoursWorked: number | string,
    billingAccountId: number | string,
): Promise<AssignmentPayment> {
    const numericAmount = Number(amount)
    const numericHoursWorked = Number(hoursWorked)

    const payload: MemberPaymentPayload = {
        attributes: {
            agreementRate: rate,
            assignmentId,
            memberHandle,
            remarks: remarks.trim(),
        },
        category: 'ENGAGEMENT_PAYMENT',
        description: title.trim(),
        details: [
            {
                billingAccount: String(billingAccountId),
                currency: 'USD',
                grossAmount: numericAmount,
                installmentNumber: 1,
                totalAmount: numericAmount,
            },
        ],
        externalId: String(assignmentId),
        hoursWorked: Number.isFinite(numericHoursWorked) && numericHoursWorked > 0
            ? numericHoursWorked
            : undefined,
        origin: 'Topcoder',
        status: DEFAULT_ENGAGEMENT_PAYMENT_STATUS,
        title: title.trim(),
        type: 'PAYMENT',
        winnerId: String(memberId),
    }

    try {
        return xhrPostAsync<MemberPaymentPayload, AssignmentPayment>(
            `${TC_FINANCE_API_URL}/winnings`,
            payload,
        )
    } catch (error) {
        throw normalizeError(error, 'Failed to create payment')
    }
}

export async function fetchAssignmentPayments(
    assignmentId: number | string,
): Promise<AssignmentPayment[]> {
    try {
        const response = await xhrGetAsync<unknown>(
            `${TC_FINANCE_API_URL}/winnings/by-external-id/${assignmentId}`,
        )

        const payments = await hydratePaymentCreatorHandles(normalizePaymentsResponse(response))

        return hydratePaymentBillingAccountNames(payments)
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch payment history')
    }
}

export async function createPayment(
    paymentData: Record<string, unknown>,
): Promise<AssignmentPayment> {
    try {
        return await xhrPostAsync<Record<string, unknown>, AssignmentPayment>(
            `${TC_FINANCE_API_URL}/winnings`,
            paymentData,
        )
    } catch (error) {
        throw normalizeError(error, 'Failed to create payment')
    }
}

export async function getPaymentsByAssignmentId(
    assignmentId: number | string,
): Promise<AssignmentPayment[]> {
    return fetchAssignmentPayments(assignmentId)
}
