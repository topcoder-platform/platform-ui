import { Context, createContext } from 'react'

import { ProfileContextData } from './profile-context-data.model'

export const defaultProfileContextData: ProfileContextData = {
    changePassword: () => Promise.resolve(),
    initialized: false,
    isLoggedIn: false,
    updateProfile: () => Promise.resolve(undefined),
}

const profileContext: Context<ProfileContextData> = createContext(defaultProfileContextData)

export default profileContext
