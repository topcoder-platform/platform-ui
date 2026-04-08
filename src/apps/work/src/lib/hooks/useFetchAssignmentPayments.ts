import useSWR, { SWRResponse } from 'swr'

import {
    AssignmentPayment,
} from '../models'
import {
    fetchAssignmentPayments,
} from '../services'

export interface UseFetchAssignmentPaymentsResult {
    error: Error | undefined
    isLoading: boolean
    isValidating: boolean
    mutate: SWRResponse<AssignmentPayment[], Error>['mutate']
    payments: AssignmentPayment[]
}

export function useFetchAssignmentPayments(
    assignmentId?: number | string,
): UseFetchAssignmentPaymentsResult {
    const swrKey = assignmentId
        ? ['work/assignment-payments', assignmentId]
        : undefined

    const {
        data,
        error,
        isValidating,
        mutate,
    }: SWRResponse<AssignmentPayment[], Error>
        = useSWR<AssignmentPayment[], Error>(
            swrKey,
            () => fetchAssignmentPayments(assignmentId as string),
            {
                errorRetryCount: 2,
                shouldRetryOnError: true,
            },
        )

    return {
        error,
        isLoading: !!assignmentId && !data && !error,
        isValidating,
        mutate,
        payments: data || [],
    }
}
