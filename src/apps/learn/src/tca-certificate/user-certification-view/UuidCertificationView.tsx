import { FC, useLayoutEffect } from 'react'
import { NavigateFunction, Params, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { LoadingSpinner } from '~/libs/ui'

import {
    TCACertification,
    TCACertificationEnrollmentProviderData,
    useTCACertificationEnrollment,
} from '../../lib'
import { getTCAUserCertificationUrl } from '../../learn.routes'

import UserCertificationViewBase from './UserCertificationViewBase'

const UuidCertificationView: FC<{}> = () => {
    const navigate: NavigateFunction = useNavigate()
    const routeParams: Params<string> = useParams()
    const [queryParams]: [URLSearchParams, any] = useSearchParams()

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
                `${getTCAUserCertificationUrl(
                    certification?.dashedName as string,
                    enrollment.userHandle,
                )}?${queryParams.toString()}`,
                { replace: true },
            )
        }
    }, [certification?.dashedName, enrollment, enrollmentReady, navigate, queryParams])

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
