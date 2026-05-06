import useSWR, { SWRResponse } from 'swr'

import {
    BillingAccountDetails,
    fetchBillingAccountById,
} from '../services'

export interface UseFetchBillingAccountDetailsResult {
    billingAccountDetails: BillingAccountDetails | undefined
    error: Error | undefined
    isError: boolean
    isLoading: boolean
}

function normalizeId(billingAccountId: string | number | undefined): string {
    if (billingAccountId === undefined || billingAccountId === null) {
        return ''
    }

    return String(billingAccountId)
        .trim()
}

/**
 * Fetches detailed billing account information including locked and consumed external entries.
 *
 * @param billingAccountId The billing account identifier to fetch.
 * @returns Billing account details with budget totals and typed external-entry line item payloads.
 */
export function useFetchBillingAccountDetails(
    billingAccountId: string | number | undefined,
): UseFetchBillingAccountDetailsResult {
    const normalizedId = normalizeId(billingAccountId)

    const swrKey = normalizedId
        ? ['work/billing-account-details', normalizedId]
        : undefined

    const {
        data,
        error,
    }: SWRResponse<BillingAccountDetails, Error>
        = useSWR<BillingAccountDetails, Error>(
            swrKey,
            () => fetchBillingAccountById(normalizedId),
            {
                errorRetryCount: 2,
                shouldRetryOnError: true,
            },
        )

    return {
        billingAccountDetails: data,
        error,
        isError: !!error,
        isLoading: !!normalizedId && !data && !error,
    }
}
