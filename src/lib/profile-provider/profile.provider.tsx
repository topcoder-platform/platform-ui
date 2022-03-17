import { Dispatch, FC, ReactNode, SetStateAction, useEffect, useState } from 'react'

import { userUpdatePassword } from '../functions'

import { ProfileContextData } from './profile-context-data.model'
import { profileGet, profileUpdate } from './profile-functions'
import { default as ProfileContext, defaultProfileContextData } from './profile.context'
import { UserProfileDetail } from './user-profile-detail.model'
import { UserProfile } from './user-profile.model'

export const ProfileProvider: FC<{ children: ReactNode }> = ({ children }: { children: ReactNode }) => {

    const [profileContext, setProfileContext]: [ProfileContextData, Dispatch<SetStateAction<ProfileContextData>>]
        = useState<ProfileContextData>(defaultProfileContextData)

    function updatePassword(userId: number, currentPassword: string, password: string): Promise<void> {
        return userUpdatePassword(userId, currentPassword, password)
    }

    function updateProfile(updatedContext: ProfileContextData): Promise<void> {

        const { profile }: ProfileContextData = updatedContext

        if (!profile) {
            throw new Error('Cannot update an undefined profile')
        }

        const updatedProfile: UserProfile = {
            email: profile.email,
            firstName: profile.firstName,
            lastName: profile.lastName,
        }

        return profileUpdate(profile.handle, updatedProfile)
            .then(() => setProfileContext(updatedContext))
    }

    useEffect(() => {

        // if our profile is already initialized, no need to continue
        if (profileContext.initialized) {
            return
        }

        const getAndSetProfile: () => Promise<void> = async () => {
            const profile: UserProfileDetail | undefined = await profileGet()
            const contextData: ProfileContextData = {
                initialized: true,
                profile,
                updatePassword,
                updateProfile,
            }
            setProfileContext(contextData)
        }

        getAndSetProfile()
    })

    return (
        <ProfileContext.Provider value={profileContext}>
            {children}
        </ProfileContext.Provider>
    )
}
