import useSWR, { SWRConfiguration, SWRResponse } from 'swr'

import { learnUrlGet } from '../../../functions'
import { useSwrCache } from '../../../learn-swr'
import { TCACertificationEnrollmentBase } from '../tca-certification-enrollment-base.model'
import { TCACertification } from '../tca-certification.model'

export interface TCACertificationEnrollmentProviderData {
    enrollment: TCACertificationEnrollmentBase
    error: boolean
    loading: boolean
    ready: boolean
}

export function useTCACertificationEnrollment(
    id: string, // note id | completionUuid both are supported by the API
): TCACertificationEnrollmentProviderData {

    const url: string = learnUrlGet(
        'certification-enrollment',
        id,
    )

    const swrCacheConfig: SWRConfiguration = useSwrCache(url)

    const { data, error }: SWRResponse = useSWR(url, {
        ...swrCacheConfig,
    })

    return {
        enrollment: data,
        error: !!error,
        loading: !data,
        ready: !!data || !!error,
    }
}

export interface CompletedTCACertificationEnrollmentData {
    enrollment: TCACertificationEnrollmentBase
    certification: TCACertification
    error: boolean
    loading: boolean
    ready: boolean
}

export function useGetCompletedTCACertificationEnrollment(
    certification: string,
    userHandle: string,
): CompletedTCACertificationEnrollmentData {

    const url: string = learnUrlGet(
        'topcoder-certifications',
        certification,
        userHandle,
        'validate',
    )

    const swrCacheConfig: SWRConfiguration = useSwrCache(url)

    const { data, error }: SWRResponse = useSWR(url, {
        ...swrCacheConfig,
    })

    return {
        certification: data?.certification,
        enrollment: data?.enrollment,
        error: !!error,
        loading: !data,
        ready: !!data,
    }
}
