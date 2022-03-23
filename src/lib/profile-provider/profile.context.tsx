import { Context, createContext } from 'react'

import { ProfileContextData } from './profile-context-data.model'

export const defaultProfileContextData: ProfileContextData = {
    initialized: false,
    updatePassword: () => Promise.resolve(),
<<<<<<< HEAD
    updateProfile: () => Promise.resolve(),
=======
    updateProfile: () => Promise.resolve(undefined),
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22
}

const ProfileContext: Context<ProfileContextData> = createContext(defaultProfileContextData)

export default ProfileContext
