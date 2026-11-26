import { FC, useContext, useEffect } from 'react'
import { Params, useParams } from 'react-router-dom'

import { LoadingSpinner } from '~/libs/ui'
import { authUrlLogin, profileContext, ProfileContextData } from '~/libs/core'

import CertificateView from '../certificate-view/CertificateView'

const MyCertificate: FC<{}> = () => {
    const routeParams: Params<string> = useParams()
    const { profile, initialized: profileReady }: ProfileContextData = useContext(profileContext)

    const providerParam: string = routeParams.provider ?? ''
    const certificationParam: string = routeParams.certification ?? ''

    useEffect(() => {
        if (profileReady && !profile) {
            window.location.replace(authUrlLogin(window.location.href))
        }
    }, [profileReady, profile])

    return (
        <>
            <LoadingSpinner hide={profileReady} />

            {profileReady && profile && (
                <CertificateView
                    certification={certificationParam}
                    profile={profile}
                    provider={providerParam}
                />
            )}
        </>
    )
}

export default MyCertificate
