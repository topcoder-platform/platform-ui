import { Dispatch, FC, ReactNode, SetStateAction, useEffect, useState } from 'react'

import { userUpdatePasswordAsync } from '../functions'

import { ChangePasswordRequest } from './change-password-request.model'
import { EditNameRequest } from './edit-name-request.model'
import { ProfileContextData } from './profile-context-data.model'
import { profileEditNameAsync, profileGetAsync } from './profile-functions'
import { UserProfile } from './user-profile.model'
import profileContext, { defaultProfileContextData } from './profile.context'

export const ProfileProvider: FC<{ children: ReactNode }> = ({ children }: { children: ReactNode }) => {

    const [profileContextData, setProfileContextData]: [ProfileContextData, Dispatch<SetStateAction<ProfileContextData>>]
        = useState<ProfileContextData>(defaultProfileContextData)

    function changePassword(userId: number, request: ChangePasswordRequest): Promise<void> {
        return userUpdatePasswordAsync(userId, request.password, request.newPassword)
    }

    async function getAndSetProfileAsync(): Promise<void> {
        const profile: UserProfile | undefined = await profileGetAsync()
        const contextData: ProfileContextData = {
            changePassword,
            initialized: true,
            isLoggedIn: !!profile,
            profile,
            updateProfile,
        }
        setProfileContextData(contextData)
    }

    function updateProfile(updatedContext: ProfileContextData): Promise<void> {

        const { profile }: ProfileContextData = updatedContext

        if (!profile) {
            throw new Error('Cannot update an undefined profile')
        }

        const request: EditNameRequest = {
            firstName: profile.firstName,
            lastName: profile.lastName,
        }

        return profileEditNameAsync(profile.handle, request)
            .then(() => setProfileContextData(updatedContext))
    }

    useEffect(() => {

        // if our profile is already initialized, no need to continue
        if (profileContextData.initialized) {
            return
        }

        getAndSetProfileAsync()
    })

    return (
        <profileContext.Provider value={profileContextData}>
            {children}
        </profileContext.Provider>
    )
}
