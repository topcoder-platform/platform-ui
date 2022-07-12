import { Dispatch, SetStateAction, useEffect, useState } from 'react'

import { MyCertificationProgressProviderData } from './my-certification-progress-provider-data.model'
import { getMyCertificationsProgressAsync, LearnMyCertificationProgress } from './my-certifications-functions'

export function useMyCertificationProgress(userId?: number, provider?: string, certification?: string): MyCertificationProgressProviderData {
    function setCertificateProgress(progress: LearnMyCertificationProgress): void {
        setState((prevState) => ({...prevState, certificateProgress: progress}))
    }

    const [state, setState]: [MyCertificationProgressProviderData, Dispatch<SetStateAction<MyCertificationProgressProviderData>>] = useState<MyCertificationProgressProviderData>({
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

        if (!userId) {
            return
        }

        getMyCertificationsProgressAsync(userId, provider, certification).then((myCertifications) => {
            setState((prevState) => ({
                ...prevState,
                certificateProgress: myCertifications.find(c => c.certification === certification),
                loading: false,
                ready: true,
            }))
        })
    }, [userId, provider, certification])

    return state
}
