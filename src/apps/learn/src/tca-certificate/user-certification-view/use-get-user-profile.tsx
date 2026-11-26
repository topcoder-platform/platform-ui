import { useEffect, useState } from 'react'

import { profileGetPublicAsync, UserProfile } from '~/libs/core'

export interface UseGetUserProfileData {
    isOwnProfile: boolean
    profile?: UserProfile
    ready: boolean
}

export function useGetUserProfile(memberHandle?: string): UseGetUserProfileData {
    const [result, setResult] = useState<{ handle: string, profile?: UserProfile }>()

    useEffect(() => {
        let current = true
        if (memberHandle) {
            profileGetPublicAsync(memberHandle)
                .catch(() => undefined)
                .then(profile => {
                    if (current) setResult({ handle: memberHandle, profile })
                })
        }

        return () => { current = false }
    }, [memberHandle])

    const ready: boolean = !!memberHandle && result?.handle === memberHandle
    const profile: UserProfile | undefined = ready ? result?.profile : undefined
    return {
        isOwnProfile: !!profile?.email,
        profile,
        ready,
    }
}
