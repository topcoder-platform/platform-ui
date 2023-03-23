import { FC, useLayoutEffect } from 'react'
import { NavigateFunction, Params, useNavigate, useParams } from 'react-router-dom'

import { LoadingSpinner } from '../../../../lib'
import {
    TCACertification,
    TCACertificationEnrollmentProviderData,
    useTCACertificationEnrollment,
} from '../../learn-lib'
import { getTCAUserCertificationUrl } from '../../learn.routes'

import UserCertificationViewBase from './UserCertificationViewBase'

const UuidCertificationView: FC<{}> = () => {
    const navigate: NavigateFunction = useNavigate()
    const routeParams: Params<string> = useParams()

    const {
        enrollment,
        error: enrollmentError,
        ready: enrollmentReady,
    }: TCACertificationEnrollmentProviderData
        = useTCACertificationEnrollment(routeParams.completionUuid as string)

    const certification: TCACertification | undefined = enrollment?.topcoderCertification

    useLayoutEffect(() => {
        if (enrollmentReady && enrollment) {
            navigate(
                getTCAUserCertificationUrl(
                    certification?.dashedName as string,
                    enrollment.userHandle,
                ),
            )
        }
    }, [certification?.dashedName, enrollment, enrollmentReady, navigate])

    return (
        <>
            <LoadingSpinner hide={enrollmentReady} />
            {enrollmentReady && enrollmentError && (
                <UserCertificationViewBase
                    enrollment={enrollment}
                    certification={certification}
                    profile={{} as any}
                    enrollmentError={enrollmentError}
                />
            )}
        </>
    )
}

export default UuidCertificationView
