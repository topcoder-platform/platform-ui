import { Dispatch, FC, ReactNode, SetStateAction, useEffect, useState } from 'react'

import { userUpdatePasswordAsync } from '../../auth'
import { ChangePasswordRequest } from '../change-password-request.model'
import { EditNameRequest } from '../edit-name-request.model'
import { profileEditNameAsync, profileGetLoggedInAsync } from '../profile-functions'
import { UserProfile } from '../user-profile.model'

import { ProfileContextData } from './profile-context-data.model'
import profileContext, { defaultProfileContextData } from './profile.context'

export interface ProfileProviderProps {
    children: ReactNode
}

export const ProfileProvider: FC<ProfileProviderProps> = (props: ProfileProviderProps) => {

    const [profileContextData, setProfileContextData]:
        [ProfileContextData, Dispatch<SetStateAction<ProfileContextData>>]
        = useState<ProfileContextData>(defaultProfileContextData)

    function changePassword(userId: number, request: ChangePasswordRequest): Promise<void> {
        return userUpdatePasswordAsync(userId, request.password, request.newPassword)
    }

    async function getAndSetProfileAsync(): Promise<void> {
        const profile: UserProfile | undefined = await profileGetLoggedInAsync()
        const contextData: ProfileContextData = {
            changePassword,
            initialized: true,
            isLoggedIn: !!profile,
            profile,
            updateProfile,
            updateProfileContext,
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

    function updateProfileContext(updatedContext: ProfileContextData): void {

        const { profile }: ProfileContextData = updatedContext

        if (!profile) {
            throw new Error('Cannot update an undefined profile')
        }

        setProfileContextData(updatedContext)
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
            {props.children}
        </profileContext.Provider>
    )
}
