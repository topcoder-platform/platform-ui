import { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react'

import { profileContext, ProfileContextData } from '../../../../lib'

import { MyCertificationCompleted } from './my-certification-completed.model'
import { MyCertificationInProgress } from './my-certification-in-progress.model'
import { myCertificationProgressGet, MyCertificationProgressStatus } from './my-certifications-functions'
import { MyCertificationsProviderData } from './my-certifications-provider-data.model'

export function useMyCertifications(): MyCertificationsProviderData {

    const profileContextData: ProfileContextData = useContext<ProfileContextData>(profileContext)
    const [state, setState]: [MyCertificationsProviderData, Dispatch<SetStateAction<MyCertificationsProviderData>>] = useState<MyCertificationsProviderData>({
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

        myCertificationProgressGet(userId)
            .then((myCertifications) => {
                const completed: Array<MyCertificationCompleted> = myCertifications
                    .filter(c => c.status === MyCertificationProgressStatus.completed)
                    .map(c => c as MyCertificationCompleted)
                const inProgress: Array<MyCertificationInProgress> = myCertifications
                    .filter(c => c.status === MyCertificationProgressStatus.inProgress)
                    .map(c => c as MyCertificationInProgress)
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
