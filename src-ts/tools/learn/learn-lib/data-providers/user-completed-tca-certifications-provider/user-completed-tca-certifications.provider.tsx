import useSWR, { SWRResponse } from 'swr'

import { learnUrlGet } from '../../functions'

import { UserCompletedTCACertification } from './user-completed-tca-certification.model'
import { UserCompletedTCACertificationsProviderData } from './user-completed-tca-certifications-provider-data.model'

const COMPLETED_CERTS_MOCK = [
    { status: 'comleted', trackType: 'web dev', completedDate: 'Dec 19, 2022' },
]

export function useGetUserTCACompletedCertifications(
    userId?: number,
    certification?: string,
): UserCompletedTCACertificationsProviderData {

    // TODO: update to actual API endpoint URL when ready
    const url: string = learnUrlGet('completed-certifications', `${userId}`)

    const { data, error }: SWRResponse<ReadonlyArray<UserCompletedTCACertification>> = useSWR(url)

    let certifications: ReadonlyArray<UserCompletedTCACertification> = data ?? []

    if (certification) {
        certifications = certifications
            .filter(c => (!certification || c.certification === certification))
    }

    return {
        certifications,
        loading: !data && !error,
        ready: !!data || !!error,
    }
}

// TODO: remove when API ready
export function useGetUserTCACompletedCertificationsMOCK(
    userId?: number,
    certification?: string,
): UserCompletedTCACertificationsProviderData {
    const data = COMPLETED_CERTS_MOCK

    return {
        certifications: data,
        loading: !data,
        ready: !!data,
    }
}
