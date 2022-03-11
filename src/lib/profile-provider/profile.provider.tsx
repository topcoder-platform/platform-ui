import { Dispatch, FC, ReactNode, SetStateAction, useEffect, useState } from 'react'

import { ProfileContextData } from './profile-context-data.model'
import { ProfileService } from './profile-service'
import { default as ProfileContext, defaultProfileContextData } from './profile.context'
import { UserProfile } from './user-profile.model'

export const ProfileProvider: FC<{ children: ReactNode }> = ({ children }: { children: ReactNode }) => {

    const [profileContext, setProfileContext]: [ProfileContextData, Dispatch<SetStateAction<ProfileContextData>>] = useState<ProfileContextData>(defaultProfileContextData)

    useEffect(() => {

        // if our profile is already initialized, no need to continue
        if (profileContext.initialized) {
            return
        }

        const getAndSetProfile: () => Promise<void> = async () => {
            const profile: UserProfile | undefined = await new ProfileService().get()
            const contextData: ProfileContextData = {
                initialized: true,
                profile,
            }
            setProfileContext(contextData)
        }

        getAndSetProfile()
    }, [
        profileContext.initialized,
    ])

    return (
        <ProfileContext.Provider value={profileContext}>
            {children}
        </ProfileContext.Provider>
    )
}
