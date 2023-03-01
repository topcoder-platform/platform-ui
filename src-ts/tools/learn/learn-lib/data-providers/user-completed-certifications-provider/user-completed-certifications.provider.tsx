import { get } from 'lodash'
import useSWR, { SWRResponse } from 'swr'

import { learnUrlGet } from '../../functions'
import { TCACertificationEnrollmentBase } from '../tca-certifications-provider'
import { LearnUserCertificationProgress } from '../user-certifications-provider'

import { UserCompletedCertificationsProviderData } from './user-completed-certifications-provider-data.model'

export function useGetUserCompletedCertifications(
    userId?: number,
    provider?: string,
    certification?: string,
): UserCompletedCertificationsProviderData {

    const url: string = learnUrlGet('completed-certifications', `${userId}`)

    const { data, error }: SWRResponse<{
        enrollments: ReadonlyArray<TCACertificationEnrollmentBase>,
        courses: ReadonlyArray<LearnUserCertificationProgress>,
    }> = useSWR(url)

    let certifications: ReadonlyArray<LearnUserCertificationProgress> = []

    if (provider && certification) {
        certifications = (data?.courses ?? [])
            .filter(c => (
                get(c, 'resourceProvider.name') === provider
                && c.certification === certification
            ))
    }

    return {
        certifications,
        loading: !data && !error,
        ready: !!data || !!error,
    }
}
