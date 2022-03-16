import { UserProfile } from './user-profile.model'

export interface UserProfileDetail extends UserProfile {
    competitionCountryCode: string
    createdAt: number
    handle: string
    handleLower: string
    homeCountryCode: string
    photoURL?: string
    status: string
    updatedAt: number
    userId: number
}
