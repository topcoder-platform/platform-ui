import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react'
import { Params, useParams } from 'react-router-dom'

import { LoadingSpinner } from '~/libs/ui'
import { profileGetPublicAsync, UserProfile } from '~/libs/core'

import { CertificateView } from '../certificate-view'

const UserCertificate: FC<{}> = () => {

    const routeParams: Params<string> = useParams()

    const [profile, setProfile]: [
        UserProfile | undefined,
        Dispatch<SetStateAction<UserProfile | undefined>>
    ] = useState()
    const [profileReady, setProfileReady]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    const providerParam: string = routeParams.provider ?? ''
    const certificationParam: string = routeParams.certification ?? ''

    useEffect(() => {
        if (routeParams.memberHandle) {
            profileGetPublicAsync(routeParams.memberHandle)
                .then(userProfile => {
                    setProfile(userProfile)
                    setProfileReady(true)
                })
        }
    }, [routeParams.memberHandle, setProfileReady])

    return (
        <>
            <LoadingSpinner hide={profileReady} />

            {profileReady && profile && (
                <CertificateView
                    certification={certificationParam}
                    profile={profile}
                    provider={providerParam}
                    fullScreenCertLayout
                />
            )}
        </>
    )
}

export default UserCertificate
