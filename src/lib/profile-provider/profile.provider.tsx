import { Dispatch, FC, ReactNode, SetStateAction, useEffect, useState } from 'react'

<<<<<<< HEAD
import { updatePassword as updateUserPassword } from '../functions'

import { ProfileContextData } from './profile-context-data.model'
import { get as profileGet, update as profileUpdate } from './profile-functions'
import { default as ProfileContext, defaultProfileContextData } from './profile.context'
import { UserProfileDetail } from './user-profile-detail.model'
=======
import { userUpdatePasswordAsync } from '../functions'

import { PasswordUpdateRequest } from './password-update-request.model'
import { ProfileContextData } from './profile-context-data.model'
import { profileGetAsync, profileUpdateAsync } from './profile-functions'
import { default as ProfileContext, defaultProfileContextData } from './profile.context'
import { UserProfileUpdateRequest } from './user-profile-update-request.model'
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22
import { UserProfile } from './user-profile.model'

export const ProfileProvider: FC<{ children: ReactNode }> = ({ children }: { children: ReactNode }) => {

    const [profileContext, setProfileContext]: [ProfileContextData, Dispatch<SetStateAction<ProfileContextData>>]
        = useState<ProfileContextData>(defaultProfileContextData)

<<<<<<< HEAD
    function updatePassword(userId: number, currentPassword: string, password: string): Promise<void> {
        return updateUserPassword(userId, currentPassword, password)
=======
    function updatePassword(userId: number, request: PasswordUpdateRequest): Promise<void> {
        return userUpdatePasswordAsync(userId, request.password, request.newPassword)
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22
    }

    function updateProfile(updatedContext: ProfileContextData): Promise<void> {

        const { profile }: ProfileContextData = updatedContext

        if (!profile) {
            throw new Error('Cannot update an undefined profile')
        }

<<<<<<< HEAD
        const updatedProfile: UserProfile = {
=======
        const request: UserProfileUpdateRequest = {
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22
            email: profile.email,
            firstName: profile.firstName,
            lastName: profile.lastName,
        }

<<<<<<< HEAD
        return profileUpdate(profile.handle, updatedProfile)
=======
        return profileUpdateAsync(profile.handle, request)
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22
            .then(() => setProfileContext(updatedContext))
    }

    useEffect(() => {

        // if our profile is already initialized, no need to continue
        if (profileContext.initialized) {
            return
        }

<<<<<<< HEAD
        const getAndSetProfile: () => Promise<void> = async () => {
            const profile: UserProfileDetail | undefined = await profileGet()
=======
        const getAndSetProfileAsync: () => Promise<void> = async () => {
            const profile: UserProfile | undefined = await profileGetAsync()
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22
            const contextData: ProfileContextData = {
                initialized: true,
                profile,
                updatePassword,
                updateProfile,
            }
            setProfileContext(contextData)
        }

<<<<<<< HEAD
        getAndSetProfile()
=======
        getAndSetProfileAsync()
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22
    })

    return (
        <ProfileContext.Provider value={profileContext}>
            {children}
        </ProfileContext.Provider>
    )
}
