import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react'

import { ProfileContextData } from './profile-context-data.model'
import { ProfileService } from './profile-service'
import ProfileContext, { defaultProfileContextData } from './profile.context'
import { UserProfile } from './user-profile.model'

export const ProfileProvider: FC<{ children: Array<JSX.Element> }> = ({ children }: { children: Array<JSX.Element> }) => {

    const [profileContext, setProfileContext]: [ProfileContextData | undefined, Dispatch<SetStateAction<ProfileContextData | undefined>>] = useState<ProfileContextData | undefined>()

    const getProfile: () => Promise<void> = async () => {
        const newProfile: UserProfile | undefined = await new ProfileService().get()
        const contextData: ProfileContextData = {
            initialized: true,
            ...newProfile,
        }
        setProfileContext(contextData)
        console.debug('set profile', contextData)
    }

    useEffect(() => {
        console.debug('use effect', profileContext)
        if (!!profileContext) {
            return
        }
        getProfile()
    }, [
        profileContext,
    ])

    return (
        <ProfileContext.Provider value={defaultProfileContextData}>
            {children}
        </ProfileContext.Provider>
    )
}
