import useSWR, { SWRConfiguration, SWRResponse } from 'swr'

import { learnUrlGet, learnXhrPostAsync } from '../../../functions'
import { useSwrCache } from '../../../learn-swr'
import { TCACertificationProgress } from '../tca-certification-progress'

import { TCACertificationProviderData } from './tca-certification-data.model'

interface TCACertificationProviderOptions {
    enabled?: boolean
}

export function useGetTCACertification(
    certification: string,
    options?: TCACertificationProviderOptions,
): TCACertificationProviderData {

    const url: string = learnUrlGet(
        'topcoder-certifications',
        certification,
    )
    const swrCacheConfig: SWRConfiguration = useSwrCache(url)

    const { data, error, mutate }: SWRResponse = useSWR(url, {
        ...swrCacheConfig,
        isPaused: () => options?.enabled === false,
    })

    return {
        certification: data,
        error: !!error,
        loading: !data,
        mutate,
        ready: !!data,
    }
}

export function enrollTCACertificationAsync(
    userId: string,
    certificationId: string,
): Promise<TCACertificationProgress> {

    const url: string = learnUrlGet(
        'topcoder-certifications',
        userId,
        certificationId,
        'enroll',
    )
    return learnXhrPostAsync<{}, TCACertificationProgress>(url, {}, {})
}
