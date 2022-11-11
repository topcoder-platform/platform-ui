import { useContext, useMemo } from 'react'
import useSWR, { SWRResponse } from 'swr'

import { errorHandle, profileContext, ProfileContextData } from '../../../../../lib'
import { learnUrlGet } from '../../functions'

import { UserCertificationCompleted } from './user-certification-completed.model'
import { UserCertificationInProgress } from './user-certification-in-progress.model'
import { LearnUserCertificationProgress, UserCertificationProgressStatus } from './user-certifications-functions'
import { UserCertificationsProviderData } from './user-certifications-provider-data.model'

export function useGetUserCertifications(
    provider: string = 'freeCodeCamp',
): UserCertificationsProviderData {
    const profileContextData: ProfileContextData = useContext<ProfileContextData>(profileContext)
    const userId: number | undefined = profileContextData?.profile?.userId

    const params: string = [
        `?userId=${userId}`,
        provider && `provider=${provider}`,
    ]
        .filter(Boolean)
        .join('&')

    const url: string = learnUrlGet('certification-progresses', params)

    const { data, error }: SWRResponse<ReadonlyArray<LearnUserCertificationProgress>> = useSWR(url, {
        isPaused: () => !userId,
    })
    const loading: boolean = !data && !error

    const completed: ReadonlyArray<UserCertificationCompleted> = useMemo(() => data
        ?.filter(c => c.status === UserCertificationProgressStatus.completed)
        .map(c => c as UserCertificationCompleted)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()) ?? []
    , [data])

    const inProgress: ReadonlyArray<UserCertificationInProgress> = useMemo(() => data
        ?.filter(c => c.status === UserCertificationProgressStatus.inProgress)
        .map(c => c as UserCertificationInProgress)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()) ?? []
    , [data])

    if (error) {
        errorHandle(error, 'There was an error getting your course progress.')
    }

    return {
        completed,
        inProgress,
        loading: !!userId && loading,

        // ready when:
        // profile context was initialized and
        // user is logged out, or
        // data or error is available
        ready: profileContextData.initialized && (!userId || !loading),
    }
}
