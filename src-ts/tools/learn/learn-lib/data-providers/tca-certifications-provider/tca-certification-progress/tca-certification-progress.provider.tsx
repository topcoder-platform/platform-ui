import useSWR, { SWRConfiguration, SWRResponse } from 'swr'

import { learnUrlGet, learnXhrGetAsync } from '../../../functions'
import { useSwrCache } from '../../../learn-swr'

import { TCACertificationProgressProviderData } from './tca-certification-progress-data.model'
import { TCACertificationProgress } from './tca-certification-progress.model'

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
        fetcher: (resUrl: string) => (
            learnXhrGetAsync<TCACertificationProgress>(resUrl)
                .then((progress: TCACertificationProgress) => ({ progress }))
        ),
        isPaused: () => options?.enabled === false,
    })

    return {
        error: !!error,
        loading: isValidating,
        progress: data?.progress,
        ready: !!data,
        refetch: () => mutate(),
        setCertificateProgress: progress => mutate([progress]),
    }
}
