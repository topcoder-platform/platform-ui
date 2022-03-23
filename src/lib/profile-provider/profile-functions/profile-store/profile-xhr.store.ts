import { xhrGetAsync, xhrPutAsync } from '../../../functions'
import { UserProfileUpdateRequest } from '../../user-profile-update-request.model'
import { UserProfile } from '../../user-profile.model'

import { profile as profileUrl } from './profile-endpoint.config'

export function get(handle: string): Promise<UserProfile> {
    return xhrGetAsync<UserProfile>(profileUrl(handle))
}

export function put(handle: string, profile: UserProfileUpdateRequest): Promise<UserProfile> {
    return xhrPutAsync<UserProfileUpdateRequest, UserProfile>(profileUrl(handle), profile)
}
