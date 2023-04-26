import { Dispatch, SetStateAction, useEffect, useState } from 'react'

import { profileGetPublicAsync, UserProfile } from '../../../../lib'

export interface UseGetUserProfileData {
    isOwnProfile: boolean
    profile?: UserProfile
    ready: boolean
}

export function useGetUserProfile(memberHandle?: string): UseGetUserProfileData {
    const [profile, setProfile]: [
        UserProfile | undefined,
        Dispatch<SetStateAction<UserProfile | undefined>>
    ] = useState()

    const [profileReady, setProfileReady]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    useEffect(() => {
        if (memberHandle) {
            profileGetPublicAsync(memberHandle)
                .then(userProfile => {
                    setProfile(userProfile)
                    setProfileReady(true)
                })
        }
    }, [memberHandle, setProfileReady])

    return {
        isOwnProfile: !!profile?.email,
        profile,
        ready: profileReady,
    }
}
