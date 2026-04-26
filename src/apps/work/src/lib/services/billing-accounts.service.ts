import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

const BILLING_ACCOUNTS_LOOKUP_PAGE_SIZE = 1000

export interface BillingAccount {
    active?: boolean
    budget?: number | string
    consumedBudget?: number | string
    lockedBudget?: number | string
    markup?: number | string
    memberPaymentsRemaining?: number | string
    endDate?: string
    id: number | string
    name: string
    startDate?: string
    status?: string
    totalBudgetRemaining?: number
    [key: string]: unknown
}

export type BillingAccountLineItemStatus = 'locked' | 'consumed'
export type BillingAccountExternalType = 'CHALLENGE' | 'ENGAGEMENT'

export interface BillingAccountBudgetEntry {
    amount: number | string
    challengeId?: string
    date: string
    externalId?: string
    externalName: string | null
    externalType: BillingAccountExternalType
    memberPaymentAmount?: number | string
}

export type BillingAccountLockedAmount = BillingAccountBudgetEntry
export type BillingAccountConsumedAmount = BillingAccountBudgetEntry

export interface BillingAccountLineItem {
    id: string
    amount: number
    challengeId?: string
    date: string
    externalId?: string
    externalName?: string | null
    externalType: BillingAccountExternalType
    memberPaymentAmount?: number
    status: BillingAccountLineItemStatus
}

export interface BillingAccountDetails extends BillingAccount {
    budget: number
    lockedBudget: number
    consumedBudget: number
    totalBudgetRemaining: number
    lockedAmounts: BillingAccountLockedAmount[]
    consumedAmounts: BillingAccountConsumedAmount[]
}

interface BillingAccountsResponse {
    data?: BillingAccount[]
    page?: number
    perPage?: number
    total?: number
    totalPages?: number
}

export interface SearchBillingAccountsParams {
    name?: string
    page?: number
    perPage?: number
    userId?: number | string
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

    const errorMessage = typedError?.response?.data?.message
        || typedError?.message
        || fallbackMessage

    return new Error(errorMessage)
}

function extractBillingAccounts(
    response: BillingAccount[] | BillingAccountsResponse,
): BillingAccount[] {
    return Array.isArray(response)
        ? response
        : response?.data || []
}

function normalizeBillingAccounts(
    billingAccounts: BillingAccount[],
): BillingAccount[] {
    return billingAccounts
        .filter(account => account?.id !== undefined && account?.id !== null && !!account?.name)
        .sort((accountA, accountB) => accountA.name.localeCompare(accountB.name))
}

function createSearchQuery(params: SearchBillingAccountsParams): string {
    const query = new URLSearchParams()

    if (params.name?.trim()) {
        query.set('name', params.name.trim())
    }

    if (params.page && Number.isInteger(params.page) && params.page > 0) {
        query.set('page', String(params.page))
    }

    if (params.perPage && Number.isInteger(params.perPage) && params.perPage > 0) {
        query.set('perPage', String(params.perPage))
    }

    if (params.userId !== undefined && params.userId !== null) {
        const normalizedUserId = String(params.userId)
            .trim()

        if (normalizedUserId) {
            query.set('userId', normalizedUserId)
        }
    }

    const queryString = query.toString()

    return queryString
        ? `?${queryString}`
        : ''
}

/**
 * Creates a deterministic UI-only row key from the source bucket and stable row context.
 *
 * @param status The source budget bucket for the row.
 * @param item The raw external budget entry returned by the billing account API.
 * @param index The entry index within its source bucket, used to keep repeated rows unique.
 * @returns A row key suitable for React rendering.
 */
function createLineItemKey(
    status: BillingAccountLineItemStatus,
    item: BillingAccountBudgetEntry,
    index: number,
): string {
    return [
        status,
        item.externalType,
        item.externalId || item.challengeId || 'unknown',
        item.date || 'unknown-date',
        item.amount,
        index,
    ]
        .map(value => encodeURIComponent(String(value)))
        .join('-')
}

/**
 * Converts an API budget entry into a UI line item without aliasing legacy challenge ids.
 *
 * @param status The budget bucket the API entry came from.
 * @param item The raw external budget entry returned by the billing account API.
 * @param index The entry index within its source bucket, used in the generated row key.
 * @returns A normalized line item with numeric amount, original date, display
 * fallback for nullable external names, optional canonical external id,
 * optional legacy challenge id, optional copilot-safe member payment amount,
 * and a deterministic UI row key.
 */
function createLineItem(
    status: BillingAccountLineItemStatus,
    item: BillingAccountBudgetEntry,
    index: number,
): BillingAccountLineItem {
    const normalizedExternalName = item.externalName
        || item.externalId
        || item.challengeId
    const lineItem: BillingAccountLineItem = {
        amount: Number(item.amount),
        date: item.date,
        externalType: item.externalType,
        id: createLineItemKey(status, item, index),
        status,
    }

    if (normalizedExternalName) {
        lineItem.externalName = normalizedExternalName
    }

    if (item.challengeId) {
        lineItem.challengeId = item.challengeId
    }

    if (item.externalId) {
        lineItem.externalId = item.externalId
    }

    const memberPaymentAmount = Number(item.memberPaymentAmount)

    if (Number.isFinite(memberPaymentAmount)) {
        lineItem.memberPaymentAmount = memberPaymentAmount
    }

    return lineItem
}

/**
 * Fetches billing accounts using a large lookup page for project-list joins.
 *
 * Returns only accounts with both `id` and `name`, sorted by name.
 */
export async function fetchBillingAccounts(): Promise<BillingAccount[]> {
    try {
        const response = await xhrGetAsync<BillingAccount[] | BillingAccountsResponse>(
            `${EnvironmentConfig.API.V6}/billing-accounts?perPage=${BILLING_ACCOUNTS_LOOKUP_PAGE_SIZE}`,
        )

        return normalizeBillingAccounts(extractBillingAccounts(response))
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch billing accounts')
    }
}

/**
 * Searches billing accounts by name with optional pagination and user scoping.
 *
 * Returns only accounts with both `id` and `name`, sorted by name. When
 * `userId` is provided, the API limits results to billing accounts that user
 * can access.
 */
export async function searchBillingAccounts(
    params: SearchBillingAccountsParams,
): Promise<BillingAccount[]> {
    try {
        const query = createSearchQuery(params)
        const response = await xhrGetAsync<BillingAccount[] | BillingAccountsResponse>(
            `${EnvironmentConfig.API.V6}/billing-accounts${query}`,
        )

        return normalizeBillingAccounts(extractBillingAccounts(response))
    } catch (error) {
        throw normalizeError(error, 'Failed to search billing accounts')
    }
}

/**
 * Fetches a single billing account by its identifier.
 *
 * The detail payload includes budget totals plus locked and consumed external
 * entries with `amount`, optional copilot-safe `memberPaymentAmount`, `date`,
 * optional canonical `externalId`, `externalType`, and nullable `externalName`.
 * Top-level `id` and `name` remain available for lookup labels.
 */
export async function fetchBillingAccountById(
    billingAccountId: string,
): Promise<BillingAccountDetails> {
    const normalizedBillingAccountId = billingAccountId.trim()

    if (!normalizedBillingAccountId) {
        throw new Error('Billing account id is required')
    }

    try {
        return await xhrGetAsync<BillingAccountDetails>(
            `${EnvironmentConfig.API.V6}/billing-accounts/${encodeURIComponent(normalizedBillingAccountId)}`,
        )
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch billing account details')
    }
}

/**
 * Combines locked and consumed external budget entries into UI line items.
 *
 * @param details Billing account details containing locked and consumed entry arrays.
 * @returns Normalized line items with numeric amounts, optional member payment
 * amounts, API dates, external metadata, status, and UI row keys.
 */
export function combineBillingAccountLineItems(
    details: BillingAccountDetails,
): BillingAccountLineItem[] {
    const lockedItems: BillingAccountLineItem[] = (details.lockedAmounts || []).map(
        (item, index) => createLineItem('locked', item, index),
    )

    const consumedItems: BillingAccountLineItem[] = (details.consumedAmounts || []).map(
        (item, index) => createLineItem('consumed', item, index),
    )

    return [...lockedItems, ...consumedItems]
}
