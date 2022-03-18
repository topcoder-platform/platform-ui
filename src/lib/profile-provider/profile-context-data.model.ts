import { PasswordUpdateRequest } from './password-update-request.model'
import { UserProfileDetail } from './user-profile-detail.model'
import { UserProfile } from './user-profile.model'

export interface ProfileContextData {
    initialized: boolean
    profile?: UserProfileDetail
    updatePassword: (userId: number, request: PasswordUpdateRequest) => Promise<void>
    updateProfile: (handle: string, profile: UserProfile) => Promise<UserProfile>
}
