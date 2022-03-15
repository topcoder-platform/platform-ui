import { UserProfileDetail } from './user-profile-detail.model'

export interface ProfileContextData {
    initialized: boolean
    profile?: UserProfileDetail
    updateProfile: (profileContext: ProfileContextData) => Promise<void>
}
