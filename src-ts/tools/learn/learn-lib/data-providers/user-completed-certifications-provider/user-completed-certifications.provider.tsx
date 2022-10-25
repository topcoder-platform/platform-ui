import useSWR, { SWRResponse } from 'swr'

import { learnUrlGet } from '../../functions'
import { LearnUserCompletedCertification } from './user-completed-certification.model'
import { UserCompletedCertificationsProviderData } from './user-completed-certifications-provider-data.model'

export function useGetUserCompletedCertifications(
    userId?: number,
    provider?: string,
    certification?: string
): UserCompletedCertificationsProviderData {

    const url: string = learnUrlGet('completed-certifications', `${userId}`)

    const {data, error}: SWRResponse<ReadonlyArray<LearnUserCompletedCertification>> = useSWR(url)

    let certifications: ReadonlyArray<LearnUserCompletedCertification> = data ?? []

    if (provider || certification) {
        certifications = certifications.filter((c) => {
            return (!provider || c.provider === provider) &&
            (!certification || c.certification === certification)
        })
    }

    return {
        certifications,
        loading: !data && !error,
        ready: !!data || !!error,
    }
}
