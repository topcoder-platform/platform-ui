import { Context, createContext } from 'react'

import { ProfileContextData } from './profile-context-data.model'

export const defaultContextData: ProfileContextData = {
    initialized: true,
    profile: {
        competitionCountryCode: 'string',
        createdAt: 123456,
        email: 'string',
        firstName: 'brooke',
        handle: 'brookesouza',
        handleLower: 'brookesouza',
        homeCountryCode: 'string',
        lastName: 'souza',
        photoURL: undefined,
        status: 'string',
        updatedAt: 135465,
        userId: 1654654,
    },
}

const ProfileContext: Context<ProfileContextData> = createContext(defaultContextData)

export default ProfileContext
