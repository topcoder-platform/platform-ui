import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

export interface BillingAccount {
    active?: boolean
    endDate?: string
    id: number | string
    name: string
    startDate?: string
    status?: string
    [key: string]: unknown
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

    const queryString = query.toString()

    return queryString
        ? `?${queryString}`
        : ''
}

/**
 * Fetches billing accounts using default API pagination.
 *
 * Returns only accounts with both `id` and `name`, sorted by name.
 */
export async function fetchBillingAccounts(): Promise<BillingAccount[]> {
    try {
        const response = await xhrGetAsync<BillingAccount[] | BillingAccountsResponse>(
            `${EnvironmentConfig.API.V6}/billing-accounts`,
        )

        return normalizeBillingAccounts(extractBillingAccounts(response))
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch billing accounts')
    }
}

/**
 * Searches billing accounts by name and optional pagination.
 *
 * Returns only accounts with both `id` and `name`, sorted by name.
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
 */
export async function fetchBillingAccountById(
    billingAccountId: string,
): Promise<BillingAccount> {
    const normalizedBillingAccountId = billingAccountId.trim()

    if (!normalizedBillingAccountId) {
        throw new Error('Billing account id is required')
    }

    try {
        return await xhrGetAsync<BillingAccount>(
            `${EnvironmentConfig.API.V6}/billing-accounts/${encodeURIComponent(normalizedBillingAccountId)}`,
        )
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch billing account details')
    }
}
