import { TC_TRACKS } from './user-profile.model'

export interface UpdateProfileRequest {
    addresses?: Array<{
        city?: string
        stateCode?: string
        streetAddr1?: string
        streetAddr2?: string
        zip?: string
    }>
    availableForGigs?: boolean,
    competitionCountryCode?: string
    homeCountryCode?: string
    firstName?: string
    lastName?: string
    tracks?: TC_TRACKS[],
    description?: string
}

export interface UserPhotoUpdateResponse {
    photoURL: string
}
