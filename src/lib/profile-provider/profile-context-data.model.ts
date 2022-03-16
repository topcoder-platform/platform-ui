import { UserProfileDetail } from './user-profile-detail.model'

export interface ProfileContextData {
    initialized: boolean
    profile?: UserProfileDetail
    updatePassword: (userId: number, currentPassword: string, password: string) => Promise<void>
    updateProfile: (profileContext: ProfileContextData) => Promise<void>
}
