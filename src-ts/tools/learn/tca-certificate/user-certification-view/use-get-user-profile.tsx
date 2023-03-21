import { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react'

import { profileContext, ProfileContextData, profileGetPublicAsync, UserProfile } from '../../../../lib'

export interface UseGetUserProfileData {
    isOwnProfile: boolean
    profile?: UserProfile
    ready: boolean
}

export function useGetUserProfile(memberHandle?: string): UseGetUserProfileData {
    const profileData: ProfileContextData = useContext(profileContext)

    const [profile, setProfile]: [
        UserProfile | undefined,
        Dispatch<SetStateAction<UserProfile | undefined>>
    ] = useState()

    const [profileReady, setProfileReady]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    useEffect(() => {
        if (!profileData?.initialized) {
            return
        }

        if (profileData.profile) {
            setProfile(profileData.profile)
            setProfileReady(true)
        } else if (memberHandle) {
            profileGetPublicAsync(memberHandle)
                .then(userProfile => {
                    setProfile(userProfile)
                    setProfileReady(true)
                })
        }
    }, [memberHandle, profileData?.initialized, profileData.profile, setProfileReady])

    return {
        isOwnProfile: !!profile?.email,
        profile,
        ready: profileReady,
    }
}
