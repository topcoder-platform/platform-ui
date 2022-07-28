import { Dispatch, SetStateAction, useEffect, useState } from 'react'

import { UserCertificationProgressProviderData } from './user-certification-progress-provider-data.model'
import { LearnUserCertificationProgress, userCertificationProgressGetAsync } from './user-certifications-functions'

export function useUserCertificationProgress(userId?: number, provider?: string, certification?: string):
    UserCertificationProgressProviderData {

    function setCertificateProgress(progress: LearnUserCertificationProgress): void {
        setState((prevState) => ({ ...prevState, certificationProgress: progress }))
    }

    const [state, setState]:
        [UserCertificationProgressProviderData, Dispatch<SetStateAction<UserCertificationProgressProviderData>>]
        = useState<UserCertificationProgressProviderData>({
            certificationProgress: undefined,
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

        userCertificationProgressGetAsync(userId, provider, certification)
            .then((myCertifications) => {
                setState((prevState) => ({
                    ...prevState,
                    certificationProgress: myCertifications.find(c => c.certification === certification),
                    loading: false,
                    ready: true,
                }))
            })
    }, [
        certification,
        provider,
        userId,
    ])

    return state
}
