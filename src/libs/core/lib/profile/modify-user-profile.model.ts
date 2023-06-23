import { TC_TRACKS } from './user-profile.model'

export interface UpdateProfileRequest {
    firstName?: string
    lastName?: string
    tracks?: TC_TRACKS[],
    description?: string
}
