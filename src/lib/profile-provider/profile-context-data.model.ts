<<<<<<< HEAD
import { UserProfileDetail } from './user-profile-detail.model'

export interface ProfileContextData {
    initialized: boolean
    profile?: UserProfileDetail
    updatePassword: (userId: number, currentPassword: string, password: string) => Promise<void>
    updateProfile: (profileContext: ProfileContextData) => Promise<void>
=======
import { PasswordUpdateRequest } from './password-update-request.model'
import { UserProfile } from './user-profile.model'

export interface ProfileContextData {
    initialized: boolean
    profile?: UserProfile
    updatePassword: (userId: number, request: PasswordUpdateRequest) => Promise<void>
    updateProfile: (updatedProfileContext: ProfileContextData) => Promise<void>
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22
}
