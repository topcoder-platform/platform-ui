import { FC, useCallback, useContext, useEffect } from 'react'
import { NavigateFunction, Params, useNavigate, useParams } from 'react-router-dom'

import {
    LoadingSpinner,
    profileContext,
    ProfileContextData,
} from '../../../../lib'
import { getCoursePath } from '../../learn.routes'
import CertificateView from '../certificate-view/CertificateView'

const MyCertificate: FC<{}> = () => {
    const routeParams: Params<string> = useParams()
    const { profile, initialized: profileReady }: ProfileContextData = useContext(profileContext)

    const navigate: NavigateFunction = useNavigate()
    const providerParam: string = routeParams.provider ?? ''
    const certificationParam: string = routeParams.certification ?? ''
    const coursePath: string = getCoursePath(providerParam, certificationParam)

    const navigateToCourse: () => void = useCallback(() => {
        navigate(coursePath)
    }, [coursePath, navigate])

    useEffect(() => {
        if (profileReady && !profile) {
            navigateToCourse()
        }
    }, [profileReady, profile, navigateToCourse])

    return (
        <>
            <LoadingSpinner hide={profileReady} />

            {profileReady && profile && (
                <CertificateView
                    certification={certificationParam}
                    profile={profile}
                    provider={providerParam}
                    onCertificationNotCompleted={navigateToCourse}
                />
            )}
        </>
    )
}

export default MyCertificate
