import useSWR, { SWRConfiguration, SWRResponse } from 'swr'

import { learnUrlGet } from '../../../functions'
import { useSwrCache } from '../../../learn-swr'

import { TCACertificationsProgressProviderData } from './tca-all-certifications-progress-data.model'

interface TCACertificationsProgressProviderOptions {
    enabled?: boolean
}

export function useGetAllTCACertificationsProgress(
    userId: string,
    options?: TCACertificationsProgressProviderOptions,
): TCACertificationsProgressProviderData {

    const url: string = learnUrlGet(
        'topcoder-certifications',
        userId,
        'progresses',
    )
    const swrCacheConfig: SWRConfiguration = useSwrCache(url)

    const { data, error }: SWRResponse = useSWR(url, {
        ...swrCacheConfig,
        isPaused: () => options?.enabled === false,
    })

    return {
        error: !!error,
        loading: !data,
        progresses: data,
        ready: !!data,
    }
}
