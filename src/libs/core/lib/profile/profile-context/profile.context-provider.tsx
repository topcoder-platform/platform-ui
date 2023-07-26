import { Dispatch, FC, ReactNode, SetStateAction, useEffect, useRef, useState } from 'react'

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
    const isFetchingProfileRef = useRef<boolean>(false)

    function changePassword(userId: number, request: ChangePasswordRequest): Promise<void> {
        return userUpdatePasswordAsync(userId, request.password, request.newPassword)
    }

    async function getAndSetProfileAsync(): Promise<void> {
        isFetchingProfileRef.current = true
        let profile: UserProfile | undefined
        try {
            profile = await profileGetLoggedInAsync()
        } catch (error) {
        }

        isFetchingProfileRef.current = false
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
        if (profileContextData.initialized || isFetchingProfileRef.current) {
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
