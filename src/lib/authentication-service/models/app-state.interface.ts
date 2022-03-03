
import { UserProfile } from '../../profile-service/models'

import { AuthenticationData } from './authentication-data.interface'

export interface AppState {
    auth: AuthenticationData
    profile?: UserProfile
}
