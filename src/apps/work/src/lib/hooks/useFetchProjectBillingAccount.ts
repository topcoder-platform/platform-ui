import useSWR, { SWRResponse } from 'swr'

import {
    fetchProjectBillingAccount,
    FetchProjectBillingAccountResponse,
    ProjectBillingAccount,
} from '../services'

export interface UseFetchProjectBillingAccountResult {
    billingAccount: ProjectBillingAccount | undefined
    isLoading: boolean
}

export function useFetchProjectBillingAccount(
    projectId: string | undefined,
): UseFetchProjectBillingAccountResult {
    const swrKey = projectId
        ? ['work/project-billing-account', projectId]
        : undefined

    const {
        data,
        error,
    }: SWRResponse<FetchProjectBillingAccountResponse, Error>
        = useSWR<FetchProjectBillingAccountResponse, Error>(
            swrKey,
            () => fetchProjectBillingAccount(projectId as string),
            {
                errorRetryCount: 2,
                shouldRetryOnError: true,
            },
        )

    return {
        billingAccount: data?.billingAccount,
        isLoading: !!projectId && !data && !error,
    }
}
