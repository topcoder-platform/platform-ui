import useSWR, { SWRConfiguration, SWRResponse } from 'swr'

import { learnUrlGet } from '../../../functions'
import { useSwrCache } from '../../../learn-swr'

import { TCACertificationProgressProviderData } from './tca-certification-progress-data.model'

interface TCACertificationProgressProviderOptions {
    enabled?: boolean
}

export function useGetTCACertificationProgress(
    userId: string,
    certification: string,
    options?: TCACertificationProgressProviderOptions,
): TCACertificationProgressProviderData {

    const url: string = learnUrlGet(
        'topcoder-certifications',
        certification,
        userId,
        'progress',
    )
    const swrCacheConfig: SWRConfiguration = useSwrCache(url)

    const { data, error, isValidating, mutate }: SWRResponse = useSWR(url, {
        ...swrCacheConfig,
        isPaused: () => options?.enabled === false,
    })

    return {
        error: !!error,
        loading: isValidating,
        progress: data,
        ready: !isValidating,
        refetch: () => mutate(),
        setCertificateProgress: progress => mutate([progress]),
    }
}
