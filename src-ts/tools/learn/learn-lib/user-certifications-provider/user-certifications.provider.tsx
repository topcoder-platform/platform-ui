import { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react'

import { profileContext, ProfileContextData } from '../../../../lib'

import { UserCertificationCompleted } from './user-certification-completed.model'
import { UserCertificationInProgress } from './user-certification-in-progress.model'
import { userCertificationProgressGetAsync, UserCertificationProgressStatus } from './user-certifications-functions'
import { UserCertificationsProviderData } from './user-certifications-provider-data.model'

export function useUserCertifications(): UserCertificationsProviderData {

    const profileContextData: ProfileContextData = useContext<ProfileContextData>(profileContext)
    const [state, setState]: [UserCertificationsProviderData, Dispatch<SetStateAction<UserCertificationsProviderData>>] = useState<UserCertificationsProviderData>({
        completed: [],
        inProgress: [],
        loading: false,
        ready: false,
    })

    useEffect(() => {

        setState((prevState) => ({
            ...prevState,
            loading: true,
        }))

        const userId: number | undefined = profileContextData?.profile?.userId
        if (!userId) {
            return
        }

        userCertificationProgressGetAsync(userId)
            .then((myCertifications) => {
                const completed: Array<UserCertificationCompleted> = myCertifications
                    .filter(c => c.status === UserCertificationProgressStatus.completed)
                    .map(c => c as UserCertificationCompleted)
                const inProgress: Array<UserCertificationInProgress> = myCertifications
                    .filter(c => c.status === UserCertificationProgressStatus.inProgress)
                    .map(c => c as UserCertificationInProgress)
                setState((prevState) => ({
                    ...prevState,
                    completed,
                    inProgress,
                    loading: false,
                    ready: true,
                }))
            })
    }, [profileContextData?.profile?.userId])

    return state
}
