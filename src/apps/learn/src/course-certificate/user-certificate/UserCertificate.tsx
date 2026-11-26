import {
    FC,
    MutableRefObject,
    useEffect,
    useLayoutEffect,
    useRef,
} from 'react'
import { Params, useParams } from 'react-router-dom'

import { LoadingSpinner } from '~/libs/ui'

import { CertificateView } from '../certificate-view'
import { hideSiblings } from '../../lib'
import { getUserCertificateSsr } from '../../learn.routes'
import {
    useGetUserProfile,
    UseGetUserProfileData,
} from '../../tca-certificate/user-certification-view/use-get-user-profile'

const UserCertificate: FC<{}> = () => {
    const elRef: MutableRefObject<HTMLElement | any> = useRef()

    const routeParams: Params<string> = useParams()

    const { profile, ready: profileReady }: UseGetUserProfileData = useGetUserProfile(routeParams.memberHandle)
    const providerParam: string = routeParams.provider ?? ''
    const certificationParam: string = routeParams.certification ?? ''

    useEffect(() => {
        if (profileReady && !profile && routeParams.memberHandle) {
            // A member profile can become unavailable after the certificate image was issued.
            window.location.replace(getUserCertificateSsr(
                encodeURIComponent(providerParam),
                encodeURIComponent(certificationParam),
                encodeURIComponent(routeParams.memberHandle),
                'Topcoder Academy Certificate',
            ))
        }
    }, [profileReady, profile, providerParam, certificationParam, routeParams.memberHandle])

    useLayoutEffect(() => {
        const el: HTMLElement = elRef.current
        if (!el) {
            return
        }

        hideSiblings(el)
        hideSiblings(el.parentElement as HTMLElement)
    }, [])

    return (
        <>
            <LoadingSpinner hide={profileReady} ref={elRef} />

            {profileReady && profile && (
                <CertificateView
                    certification={certificationParam}
                    profile={profile}
                    provider={providerParam}
                    fullScreenCertLayout
                    ref={elRef}
                />
            )}
        </>
    )
}

export default UserCertificate
