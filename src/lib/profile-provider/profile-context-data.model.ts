import { PasswordUpdateRequest } from './password-update-request.model'
import { UserProfileDetail } from './user-profile-detail.model'

export interface ProfileContextData {
    initialized: boolean
    profile?: UserProfileDetail
    updatePassword: (userId: number, request: PasswordUpdateRequest) => Promise<void>
    updateProfile: (updatedProfileContext: ProfileContextData) => Promise<void>
}
