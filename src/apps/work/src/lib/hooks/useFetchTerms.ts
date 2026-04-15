import useSWR, { SWRResponse } from 'swr'

import { Term } from '../models'
import { fetchTerms } from '../services'

export interface UseFetchTermsResult {
    error: Error | undefined
    isError: boolean
    isLoading: boolean
    terms: Term[]
}

export function useFetchTerms(): UseFetchTermsResult {
    const {
        data,
        error,
    }: SWRResponse<Term[], Error>
        = useSWR<Term[], Error>(
            'work/terms',
            fetchTerms,
            {
                errorRetryCount: 2,
                shouldRetryOnError: true,
            },
        )

    return {
        error,
        isError: !!error,
        isLoading: !data && !error,
        terms: data || [],
    }
}
