import {
    Dispatch,
    FC,
    SetStateAction,
    useCallback,
    useEffect,
    useState,
} from 'react'
import { NavigateFunction, Params, useNavigate, useParams } from 'react-router-dom'

import {
    LoadingSpinner,
    profileGetPublicAsync,
    UserProfile,
} from '../../../../lib'
import { getTCACertificationPath } from '../../learn.routes'
import { CertificateView } from '../certificate-view'

const UserTCACertificate: FC<{}> = () => {

    const navigate: NavigateFunction = useNavigate()
    const routeParams: Params<string> = useParams()

    const [profile, setProfile]: [
        UserProfile | undefined,
        Dispatch<SetStateAction<UserProfile | undefined>>
    ] = useState()
    const [profileReady, setProfileReady]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    const certificationParam: string = routeParams.certification ?? ''
    const tcaCertificationPath: string = getTCACertificationPath(certificationParam)

    useEffect(() => {
        if (routeParams.memberHandle) {
            profileGetPublicAsync(routeParams.memberHandle)
                .then(userProfile => {
                    setProfile(userProfile)
                    setProfileReady(true)
                })
        }
    }, [routeParams.memberHandle, setProfileReady])

    const navigateToCertification: () => void = useCallback(() => {
        navigate(tcaCertificationPath)
    }, [tcaCertificationPath, navigate])

    return (
        <>
            <LoadingSpinner hide={profileReady} />

            {profileReady && profile && (
                <CertificateView
                    certification={certificationParam}
                    profile={profile}
                    onCertificationNotCompleted={navigateToCertification}
                    fullScreenCertLayout
                />
            )}
        </>
    )
}

export default UserTCACertificate
