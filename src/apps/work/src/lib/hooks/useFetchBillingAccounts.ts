import useSWR, { SWRResponse } from 'swr'

import {
    BillingAccount,
    fetchBillingAccounts,
} from '../services'

export interface UseFetchBillingAccountsResult {
    billingAccounts: BillingAccount[]
    error: Error | undefined
    isError: boolean
    isLoading: boolean
}

export function useFetchBillingAccounts(): UseFetchBillingAccountsResult {
    const {
        data,
        error,
    }: SWRResponse<BillingAccount[], Error>
        = useSWR<BillingAccount[], Error>(
            '/billing-accounts',
            fetchBillingAccounts,
            {
                errorRetryCount: 2,
                shouldRetryOnError: true,
            },
        )

    return {
        billingAccounts: data || [],
        error,
        isError: !!error,
        isLoading: !data && !error,
    }
}
