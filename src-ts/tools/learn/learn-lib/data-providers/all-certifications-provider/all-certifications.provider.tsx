import useSWR, { SWRConfiguration, SWRResponse } from 'swr'
import { learnUrlGet } from '../../functions'
import { useSwrCache } from '../../learn-swr'

import { AllCertificationsProviderData } from './all-certifications-provider-data.model'

interface CertificationsAllProviderOptions {
    enabled?: boolean
}

export function useGetAllCertifications(
    providerName: string = 'freeCodeCamp',
    options?: CertificationsAllProviderOptions
): AllCertificationsProviderData {

    const url: string = learnUrlGet(
        'certifications',
        `?providerName=${providerName}`
    )
    const swrCacheConfig: SWRConfiguration = useSwrCache(url)

    const {data, error}: SWRResponse = useSWR(url, {
        ...swrCacheConfig,
        isPaused: () => options?.enabled === false
    })

    return {
        certifications: data ?? [],
        loading: !data,
        ready: !!data,
        error: !!error,
    }
}

export function useGetCertification(
    providerName: string = 'freeCodeCamp',
    certificationId: string,
    options?: CertificationsAllProviderOptions
): AllCertificationsProviderData {

    const url: string = learnUrlGet(
        'certifications',
        certificationId,
        `?providerName=${providerName}`
    )

    const {data, error}: SWRResponse = useSWR(url, {
        isPaused: () => options?.enabled === false
    })
    return {
        certifications: [],
        certification: data ?? undefined,
        loading: !data,
        ready: !!data,
        error: !!error,
    }
}
