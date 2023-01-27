import { FC, useCallback, useContext, useEffect } from 'react'
import { NavigateFunction, Params, useNavigate, useParams } from 'react-router-dom'

import {
    LoadingSpinner,
    profileContext,
    ProfileContextData,
} from '../../../../lib'
import { getTCACertificationPath } from '../../learn.routes'
import CertificateView from '../certificate-view/CertificateView'

const MyTCACertificate: FC<{}> = () => {
    const routeParams: Params<string> = useParams()
    const { profile, initialized: profileReady }: ProfileContextData = useContext(profileContext)

    const navigate: NavigateFunction = useNavigate()
    const certificationParam: string = routeParams.certification ?? ''
    const tcaCertificationPath: string = getTCACertificationPath(certificationParam)

    const navigateToCertification: () => void = useCallback(() => {
        navigate(tcaCertificationPath)
    }, [tcaCertificationPath, navigate])

    useEffect(() => {
        if (profileReady && !profile) {
            navigateToCertification()
        }
    }, [profileReady, profile, navigateToCertification])

    return (
        <>
            <LoadingSpinner hide={profileReady} />

            {profileReady && profile && (
                <CertificateView
                    certification={certificationParam}
                    profile={profile}
                    onCertificationNotCompleted={navigateToCertification}
                />
            )}
        </>
    )
}

export default MyTCACertificate
