import { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react'

import { profileContext, ProfileContextData } from '../../../../lib'

import { MyCertificationProgressProviderData } from './my-certification-progress-provider-data.model'
import { LearnMyCertificationProgress, myCertificationProgressGet } from './my-certifications-functions'

export function useMyCertificationProgress(provider?: string, certification?: string): MyCertificationProgressProviderData {

    const profileContextData: ProfileContextData = useContext(profileContext)

    function setCertificateProgress(progress: LearnMyCertificationProgress): void {
        setState((prevState) => ({ ...prevState, certificateProgress: progress }))
    }

    const [state, setState]: [MyCertificationProgressProviderData, Dispatch<SetStateAction<MyCertificationProgressProviderData>>]
        = useState<MyCertificationProgressProviderData>({
            certificateProgress: undefined,
            loading: false,
            ready: false,
            setCertificateProgress,
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

        myCertificationProgressGet(userId, provider, certification)
            .then((myCertifications) => {
                setState((prevState) => ({
                    ...prevState,
                    certificateProgress: myCertifications.find(c => c.certification === certification),
                    loading: false,
                    ready: true,
                }))
            })
    }, [
        certification,
        profileContextData?.profile?.userId,
        provider,
    ])

    return state
}
