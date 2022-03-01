import { AuthenticationData } from './authentication-data.interface'
import { UserProfile } from './user-profile.interface'

export interface AppState {
    auth: AuthenticationData
    profile?: UserProfile
}
