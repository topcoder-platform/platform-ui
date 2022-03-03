import { Context, createContext } from 'react'

import { ProfileContextData } from './profile-context-data.model'

export const defaultProfileContextData: ProfileContextData = {
    initialized: false,
}

const ProfileContext: Context<ProfileContextData> = createContext(defaultProfileContextData)

export default ProfileContext
