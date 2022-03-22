import { Dispatch, FC, ReactNode, SetStateAction, useEffect, useState } from 'react'

import { userUpdatePassword } from '../functions'

import { PasswordUpdateRequest } from './password-update-request.model'
import { ProfileContextData } from './profile-context-data.model'
import { profileGet, profileUpdate } from './profile-functions'
import { default as ProfileContext, defaultProfileContextData } from './profile.context'
import { UserProfileUpdateRequest } from './user-profile-update-request.model'
import { UserProfile } from './user-profile.model'

export const ProfileProvider: FC<{ children: ReactNode }> = ({ children }: { children: ReactNode }) => {

    const [profileContext, setProfileContext]: [ProfileContextData, Dispatch<SetStateAction<ProfileContextData>>]
        = useState<ProfileContextData>(defaultProfileContextData)

    function updatePassword(userId: number, request: PasswordUpdateRequest): Promise<void> {
        return userUpdatePassword(userId, request.password, request.newPassword)
    }

    function updateProfile(updatedContext: ProfileContextData): Promise<void> {

        const { profile }: ProfileContextData = updatedContext

        if (!profile) {
            throw new Error('Cannot update an undefined profile')
        }

        const request: UserProfileUpdateRequest = {
            email: profile.email,
            firstName: profile.firstName,
            lastName: profile.lastName,
        }

        return profileUpdate(profile.handle, request)
            .then(() => setProfileContext(updatedContext))
    }

    useEffect(() => {

        // if our profile is already initialized, no need to continue
        if (profileContext.initialized) {
            return
        }

        const getAndSetProfile: () => Promise<void> = async () => {
            const profile: UserProfile | undefined = await profileGet()
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
