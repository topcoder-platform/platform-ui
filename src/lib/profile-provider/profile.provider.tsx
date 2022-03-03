import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react'

import { ProfileContextData } from './profile-context-data.model'
import { ProfileService } from './profile-service'
import ProfileContext, { defaultProfileContextData } from './profile.context'
import { UserProfile } from './user-profile.model'

export const ProfileProvider: FC<{ children: Array<JSX.Element> }> = ({ children }: { children: Array<JSX.Element> }) => {

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
    }, [])

    return (
        <ProfileContext.Provider value={profileContext}>
            {children}
        </ProfileContext.Provider>
    )
}
