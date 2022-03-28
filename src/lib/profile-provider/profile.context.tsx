import { Context, createContext } from 'react'

import { ProfileContextData } from './profile-context-data.model'

export const defaultProfileContextData: ProfileContextData = {
    initialized: false,
    updatePassword: () => Promise.resolve(),
    updateProfile: () => Promise.resolve(undefined),
}

const profileContext: Context<ProfileContextData> = createContext(defaultProfileContextData)

export default profileContext
