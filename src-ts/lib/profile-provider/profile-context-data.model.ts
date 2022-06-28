import { ChangePasswordRequest } from './change-password-request.model'
import { UserProfile } from './user-profile.model'

export interface ProfileContextData {
    changePassword: (userId: number, request: ChangePasswordRequest) => Promise<void>
    initialized: boolean
    isLoggedIn: boolean
    profile?: UserProfile
    updateProfile: (updatedProfileContext: ProfileContextData) => Promise<void>
}
