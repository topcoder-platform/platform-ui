// TODO: This is duplicated in the learn app.
// We should move the types to the core lib only and update the learn app to use it.
import useSWR, { SWRResponse } from 'swr'

import {
    LearnUserCertificationProgress,
    TCACertificationEnrollmentBase,
} from '~/apps/learn/src/lib'

import { learnBaseURL } from '../profile-functions'

export interface UserCompletedCertificationsData {
    enrollments: ReadonlyArray<TCACertificationEnrollmentBase>
    courses: ReadonlyArray<LearnUserCertificationProgress>
}

export function useUserCompletedCertifications(
    userId: number | undefined,
): {
    data: UserCompletedCertificationsData | undefined
    loading: boolean
    ready: boolean
} {

    const url: string = `${learnBaseURL()}/completed-certifications/${userId}`

    const { data, error }: SWRResponse<UserCompletedCertificationsData> = useSWR(url)

    return {
        data,
        loading: !data && !error,
        ready: !!data || !!error,
    }
}
