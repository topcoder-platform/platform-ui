import { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react'

import { errorHandle, profileContext, ProfileContextData } from '../../../../lib'

import { UserCertificationCompleted } from './user-certification-completed.model'
import { UserCertificationInProgress } from './user-certification-in-progress.model'
import { userCertificationProgressGetAsync, UserCertificationProgressStatus } from './user-certifications-functions'
import { UserCertificationsProviderData } from './user-certifications-provider-data.model'

const defaultProviderData: UserCertificationsProviderData = {
    completed: [],
    inProgress: [],
    loading: false,
    ready: false,
}

export function useUserCertifications(): UserCertificationsProviderData {

    const profileContextData: ProfileContextData = useContext<ProfileContextData>(profileContext)
    const [state, setState]: [UserCertificationsProviderData, Dispatch<SetStateAction<UserCertificationsProviderData>>]
        = useState<UserCertificationsProviderData>(defaultProviderData)

    useEffect(() => {

        let mounted: boolean = true

        setState((prevState) => ({
            ...prevState,
            loading: true,
        }))

        const userId: number | undefined = profileContextData?.profile?.userId
        if (!userId) {
            if (profileContextData.initialized) {
                // user is logged out,
                // we're not going to fetch any progress, data is ready as is
                setState((prevState) => ({
                    ...prevState,
                    loading: false,
                    ready: true,
                }))
            }
            return
        }

        userCertificationProgressGetAsync(userId)
            .then((myCertifications) => {

                if (!mounted) {
                    return
                }

                const completed: ReadonlyArray<UserCertificationCompleted> = myCertifications
                    .filter(c => c.status === UserCertificationProgressStatus.completed)
                    .map(c => c as UserCertificationCompleted)
                    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())

                const inProgress: ReadonlyArray<UserCertificationInProgress> = myCertifications
                    .filter(c => c.status === UserCertificationProgressStatus.inProgress)
                    .map(c => c as UserCertificationInProgress)
                    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())

                setState((prevState) => ({
                    ...prevState,
                    completed,
                    inProgress,
                    loading: false,
                    ready: true,
                }))
            })
            .catch((err: any) => {
                errorHandle(err, 'There was an error getting your course progress.')
                setState((prevState) => ({
                    ...prevState,
                    completed: [],
                    inProgress: [],
                    loading: false,
                    ready: true,
                }))
            })

        return () => {
            mounted = false
        }
    }, [profileContextData])

    return state
}
