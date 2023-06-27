import { Dispatch, FC, SetStateAction, useCallback, useContext, useEffect, useState } from 'react'
import { Params, useParams } from 'react-router-dom'

import { profileContext, ProfileContextData, profileGetPublicAsync, UserProfile } from '~/libs/core'
import { LoadingSpinner } from '~/libs/ui'

import { ProfilePageLayout } from './page-layout'

const MemberProfilePage: FC<{}> = () => {
    const routeParams: Params<string> = useParams()

    const [profile, setProfile]: [
        UserProfile | undefined,
        Dispatch<SetStateAction<UserProfile | undefined>>
    ] = useState()

    const [profileReady, setProfileReady]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    const { profile: authProfile }: ProfileContextData = useContext(profileContext)

    useEffect(() => {
        if (routeParams.memberHandle) {
            profileGetPublicAsync(routeParams.memberHandle)
                .then(userProfile => {
                    setProfile(userProfile)
                    setProfileReady(true)
                })
            // TODO: NOT FOUND PAGE redirect/dispaly
        }
    }, [routeParams.memberHandle])

    const refreshProfile: (handle: string) => void = useCallback((handle: string) => {
        profileGetPublicAsync(handle)
            .then(userProfile => {
                setProfile(userProfile)
            })
    }, [])

    return (
        <>
            <LoadingSpinner hide={profileReady} />

            {profileReady && profile && (
                <ProfilePageLayout
                    profile={profile}
                    refreshProfile={refreshProfile}
                    authProfile={authProfile}
                />
            )}
        </>
    )
}

export default MemberProfilePage
