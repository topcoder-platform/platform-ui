import { UserProfile } from './user-profile.model'

export interface ProfileContextData {
    initialized: boolean
    profile?: UserProfile
}
