import { PasswordUpdateRequest } from './password-update-request.model'
import { UserProfile } from './user-profile.model'

export interface ProfileContextData {
    initialized: boolean
    profile?: UserProfile
    updatePassword: (userId: number, request: PasswordUpdateRequest) => Promise<void>
    updateProfile: (updatedProfileContext: ProfileContextData) => Promise<void>
}
