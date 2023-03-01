import useSWR, { SWRConfiguration, SWRResponse } from 'swr'

import { learnUrlGet } from '../../../functions'
import { TCACertificationEnrollmentBase } from '../tca-certification-enrollment-base.model'
import { TCACertification } from '../tca-certification.model'
import { useSwrCache } from '../../../learn-swr'

export interface TCACertificationValidationData {
    certification: TCACertification | undefined
    enrollment: TCACertificationEnrollmentBase | undefined
    error: boolean
    loading: boolean
    ready: boolean
}

export function useValidateTCACertification(
    dashedName: string,
    userHandle: string,
): TCACertificationValidationData {

    const url: string = learnUrlGet(
        'topcoder-certifications',
        dashedName,
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
        loading: !(data || error),
        ready: !!(data || error),
    }
}
