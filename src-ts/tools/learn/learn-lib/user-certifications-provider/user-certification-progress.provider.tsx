import { Dispatch, MutableRefObject, SetStateAction, useCallback, useEffect, useRef, useState } from 'react'

import { UserCertificationProgressProviderData } from './user-certification-progress-provider-data.model'
import { LearnUserCertificationProgress, userCertificationProgressGetAsync } from './user-certifications-functions'

export function useUserCertificationProgress(userId?: number, provider?: string, certification?: string):
    UserCertificationProgressProviderData {
    const callCounter: MutableRefObject<number> = useRef(0)

    function setCertificateProgress(progress: LearnUserCertificationProgress): void {
        setState(prevState => ({ ...prevState, certificationProgress: progress }))
        callCounter.current++
    }

    const fetchProgress: () => void = useCallback(() => {
        if (!userId) {
            return
        }

        const currentCallCounter: number = ++callCounter.current

        userCertificationProgressGetAsync(userId, provider, certification)
            .then(myCertifications => {
                // if another call to fetchProgress or to setCertificateProgress
                // was made before we got the api response
                // return, and do not update state
                if (callCounter.current !== currentCallCounter) {
                    return
                }

                setState(prevState => ({
                    ...prevState,
                    certificationProgress: myCertifications.find(c => c.certification === certification),
                    loading: false,
                    ready: true,
                }))
            })
    }, [certification, provider, userId])

    const [state, setState]:
        [UserCertificationProgressProviderData, Dispatch<SetStateAction<UserCertificationProgressProviderData>>]
        = useState<UserCertificationProgressProviderData>({
            certificationProgress: undefined,
            loading: false,
            ready: false,
            refetch: fetchProgress,
            setCertificateProgress,
        })

    useEffect(() => {
        setState(prevState => ({
            ...prevState,
            loading: true,
        }))

        fetchProgress()
    }, [certification, fetchProgress])

    return state
}
