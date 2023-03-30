import useSWR, { SWRConfiguration, SWRResponse } from 'swr'

import { learnUrlGet, learnXhrGetAsync, learnXhrPutAsync } from '../../../functions'
import { useSwrCache } from '../../../learn-swr'

import { TCACertificationProgressProviderData } from './tca-certification-progress-data.model'
import { TCACertificationProgress, TCACertificationProgressStatus } from './tca-certification-progress.model'

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

interface TCACertificationCompletedResponse {
    topcoderCertificationStatus: {
        status: TCACertificationProgressStatus
        certification: string
    }
}

export interface TCACertificationCheckCompleted {
    error: boolean
    loading: boolean
    certification: string | undefined
    ready: boolean
}

/**
 * Checks if TCA certification has been completed
 * @returns boolean
 */
export function useTCACertificationCheckCompleted(
    resourceProgressType: string,
    resourceProgressId: string | number,
    options?: TCACertificationProgressProviderOptions,
): TCACertificationCheckCompleted {

    const url: string = learnUrlGet(
        'certification-enrollment-progresses',
        resourceProgressType,
        `${resourceProgressId}`,
    )

    const { data, error }: SWRResponse<TCACertificationCompletedResponse>
    = useSWR<TCACertificationCompletedResponse>(url, {
        fetcher: () => learnXhrPutAsync<{}, TCACertificationCompletedResponse>(url, {})
            .then(d => (d || {} as TCACertificationCompletedResponse)),
        isPaused: () => options?.enabled === false,
    })

    return {
        certification: (
            data?.topcoderCertificationStatus?.status === 'completed' ? (
                data?.topcoderCertificationStatus.certification
            ) : undefined
        ),
        error: !!error,
        loading: !data,
        ready: !!data,
    }
}
