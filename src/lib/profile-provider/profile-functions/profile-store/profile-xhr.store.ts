<<<<<<< HEAD
import { get as xhrGet, put as xhrPut } from '../../../functions'
import { UserProfileDetail } from '../../user-profile-detail.model'
=======
import { xhrGetAsync, xhrPutAsync } from '../../../functions'
import { UserProfileUpdateRequest } from '../../user-profile-update-request.model'
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22
import { UserProfile } from '../../user-profile.model'

import { profile as profileUrl } from './profile-endpoint.config'

<<<<<<< HEAD
export async function get(handle: string): Promise<UserProfileDetail> {
    return xhrGet<UserProfileDetail>(profileUrl(handle))
}

export async function put(handle: string, profile: UserProfile): Promise<UserProfile> {
    return xhrPut<UserProfile>(profileUrl(handle), profile)
=======
export function get(handle: string): Promise<UserProfile> {
    return xhrGetAsync<UserProfile>(profileUrl(handle))
}

export function put(handle: string, profile: UserProfileUpdateRequest): Promise<UserProfile> {
    return xhrPutAsync<UserProfileUpdateRequest, UserProfile>(profileUrl(handle), profile)
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22
}
