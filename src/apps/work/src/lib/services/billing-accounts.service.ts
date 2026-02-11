import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

export interface BillingAccount {
    id: number | string
    name: string
    [key: string]: unknown
}

interface BillingAccountsResponse {
    data?: BillingAccount[]
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

export async function fetchBillingAccounts(): Promise<BillingAccount[]> {
    try {
        const response = await xhrGetAsync<BillingAccount[] | BillingAccountsResponse>(
            `${EnvironmentConfig.API.V6}/billing-accounts`,
        )

        const billingAccounts = Array.isArray(response)
            ? response
            : response?.data || []

        return billingAccounts
            .filter(account => account?.id !== undefined && account?.id !== null && !!account?.name)
            .sort((accountA, accountB) => accountA.name.localeCompare(accountB.name))
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch billing accounts')
    }
}
