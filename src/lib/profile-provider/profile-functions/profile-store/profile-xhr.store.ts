import { xhrGet, xhrPut } from '../../../functions'
import { UserProfileUpdateRequest } from '../../user-profile-update-request.model'
import { UserProfile } from '../../user-profile.model'

import { profile as profileUrl } from './profile-endpoint.config'

export function get(handle: string): Promise<UserProfile> {
    return xhrGet<UserProfile>(profileUrl(handle))
}

export function put(handle: string, profile: UserProfileUpdateRequest): Promise<UserProfileUpdateRequest> {
    return xhrPut<UserProfileUpdateRequest>(profileUrl(handle), profile)
}
