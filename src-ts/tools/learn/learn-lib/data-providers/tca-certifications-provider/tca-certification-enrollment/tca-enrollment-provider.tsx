import useSWR, { SWRConfiguration, SWRResponse } from 'swr'

import { learnUrlGet } from '../../../functions'
import { useSwrCache } from '../../../learn-swr'
import { TCACertificationEnrollmentProviderData } from '../tca-certification-progress'

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
        ready: !!data,
    }
}
