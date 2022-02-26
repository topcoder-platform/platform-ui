import { UserProfile } from './user-profile.interface'

export interface BaseProps {
    initialized: boolean
    profile?: UserProfile
}
