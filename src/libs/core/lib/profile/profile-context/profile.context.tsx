import { Context, createContext, useContext } from 'react'

import { ProfileContextData } from './profile-context-data.model'

export const defaultProfileContextData: ProfileContextData = {
    changePassword: () => Promise.resolve(),
    initialized: false,
    isLoggedIn: false,
    updateProfile: () => Promise.resolve(undefined),
    updateProfileContext: () => undefined,
}

const profileContext: Context<ProfileContextData> = createContext(defaultProfileContextData)

export const useProfileContext = () => useContext(profileContext);

export default profileContext
