import { FC, MutableRefObject, useLayoutEffect, useRef } from 'react'
import { NavigateFunction, Params, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { LoadingSpinner } from '~/libs/ui'

import {
    hideSiblings,
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

    const elRef: MutableRefObject<HTMLElement | any> = useRef()

    const {
        enrollment,
        error: enrollmentError,
        ready: enrollmentReady,
    }: TCACertificationEnrollmentProviderData
        = useTCACertificationEnrollment(routeParams.completionUuid as string)

    const certification: TCACertification | undefined = enrollment?.topcoderCertification
    const isModalView: boolean = queryParams.get('view-style') === 'modal'

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

    useLayoutEffect(() => {
        const el: HTMLElement = elRef.current
        if (!el || !isModalView) {
            return
        }

        hideSiblings(el.parentElement as HTMLElement)
    })

    return (
        <>
            <LoadingSpinner hide={enrollmentError} ref={elRef} />
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
