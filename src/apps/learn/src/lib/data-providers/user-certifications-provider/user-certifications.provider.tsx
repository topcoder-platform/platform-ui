import { useContext, useMemo } from 'react'
import useSWR, { SWRResponse } from 'swr'

import { profileContext, ProfileContextData } from '~/libs/core'
import { handleError } from '~/libs/shared'

import { learnUrlGet } from '../../functions'

import { UserCertificationCompleted } from './user-certification-completed.model'
import { UserCertificationInProgress } from './user-certification-in-progress.model'
import { LearnUserCertificationProgress, UserCertificationProgressStatus } from './user-certifications-functions'
import { UserCertificationsProviderData } from './user-certifications-provider-data.model'

interface GetUserCertificationsOptions {
    enabled?: boolean
}

export function useGetUserCertifications(
    provider: string = 'freeCodeCamp',
    options: GetUserCertificationsOptions = {} as GetUserCertificationsOptions,
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
        isPaused: () => !userId || options?.enabled === false,
    })
    const loading: boolean = !data && !error

    const completed: ReadonlyArray<UserCertificationCompleted> = useMemo(
        () => data
            ?.filter(c => c.status === UserCertificationProgressStatus.completed)
            .map(c => c as UserCertificationCompleted)
            .sort((a, b) => new Date(b.updatedAt)
                .getTime() - new Date(a.updatedAt)
                .getTime()) ?? [],
        [data],
    )

    const inProgress: ReadonlyArray<UserCertificationInProgress> = useMemo(
        () => data
            ?.filter(c => c.status === UserCertificationProgressStatus.inProgress)
            .map(c => c as UserCertificationInProgress)
            .sort((a, b) => new Date(b.updatedAt)
                .getTime() - new Date(a.updatedAt)
                .getTime()) ?? [],
        [data],
    )

    if (error) {
        handleError(error, 'There was an error getting your course progress.')
    }

    return {
        completed,
        inProgress,
        loading: !!userId && loading,
        progresses: data ?? [],

        // ready when:
        // profile context was initialized and
        // user is logged out, or
        // data or error is available
        ready: profileContextData.initialized && (!userId || !loading),
    }
}
