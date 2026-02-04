import { NamesAndHandleAppearance, TC_TRACKS } from './user-profile.model'

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
    email?: string
    firstName?: string
    lastName?: string
    phones?: Array<{
        type: string
        number: string
    }>
    tracks?: TC_TRACKS[],
    description?: string
    namesAndHandleAppearance?: NamesAndHandleAppearance
}

export interface UserPhotoUpdateResponse {
    photoURL: string
}
