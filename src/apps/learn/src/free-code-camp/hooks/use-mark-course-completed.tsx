import { noop } from 'lodash'
import { MutableRefObject, useEffect, useRef } from 'react'
import { NavigateFunction, useLocation, useNavigate } from 'react-router-dom'

import {
    LearnUserCertificationProgress,
    userCertificationProgressCompleteCourseAsync,
    UserCertificationProgressStatus,
} from '../../lib'
import { getCertificationCompletedPath } from '../../learn.routes'

export const useCheckAndMarkCourseCompleted: (
    isLoggedIn: boolean,
    providerName: string,
    certificateProgress?: LearnUserCertificationProgress,
    userHandle?: string,
    setCertificateProgress?: (progess: LearnUserCertificationProgress) => void
) => void = (isLoggedIn, providerName, certificateProgress, userHandle, setCertificateProgress = noop) => {
    const navigate: NavigateFunction = useNavigate()
    const location: any = useLocation()
    const isUpdating: MutableRefObject<boolean> = useRef(false)

    useEffect(() => {
        // if we don't yet have the user's handle,
        // or if the cert isn't complete,
        // or the cert isn't in progress,
        // there's nothing to do
        if (
            isUpdating.current
            || !isLoggedIn
            || certificateProgress?.certificationProgressPercentage !== 100
            || certificateProgress?.status !== UserCertificationProgressStatus.inProgress
        ) {
            return
        }

        // Prevent further calls to the backend until this one is completed
        isUpdating.current = true
        // it's safe to complete the course
        userCertificationProgressCompleteCourseAsync(
            certificateProgress?.id,
            certificateProgress.certification,
            userHandle as string,
            providerName,
        )
            .then(setCertificateProgress)
            .then(() => {
                const completedPath: string = getCertificationCompletedPath(
                    providerName,
                    certificateProgress.certification,
                )
                isUpdating.current = false
                navigate(completedPath, {
                    state: {
                        tcaCertInfo: location.state?.tcaCertInfo,
                    },
                })
            })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        certificateProgress,
        isLoggedIn,
        userHandle,
        providerName,
        location.state,
    ])
}
