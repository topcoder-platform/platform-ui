import { xhrGet, xhrPut } from '../../../functions'
import { UserProfileDetail } from '../../user-profile-detail.model'
import { UserProfile } from '../../user-profile.model'

import { profile as profileUrl } from './profile-endpoint.config'

export function get(handle: string): Promise<UserProfileDetail> {
    return xhrGet<UserProfileDetail>(profileUrl(handle))
}

export function put(handle: string, profile: UserProfile): Promise<UserProfile> {
    return xhrPut<UserProfile>(profileUrl(handle), profile)
}
