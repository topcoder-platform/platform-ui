import { FC, useCallback, useContext, useEffect } from 'react'
import { NavigateFunction, Params, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import {
    LoadingSpinner,
    profileContext,
    ProfileContextData,
} from '../../../../lib'
import { getTCACertificationPath, getViewStyleParamKey } from '../../learn.routes'
import CertificateView, { CertificateViewStyle } from '../certificate-view/CertificateView'

const MyTCACertificate: FC<{}> = () => {
    const routeParams: Params<string> = useParams()
    const { profile, initialized: profileReady }: ProfileContextData = useContext(profileContext)
    const [queryParams]: [URLSearchParams, any] = useSearchParams()

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
                    viewStyle={queryParams.get(getViewStyleParamKey()) as CertificateViewStyle}
                />
            )}
        </>
    )
}

export default MyTCACertificate
