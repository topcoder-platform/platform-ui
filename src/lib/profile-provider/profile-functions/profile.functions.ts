import { tokenGet } from '../../functions/token-functions'
import { UserProfileUpdateRequest } from '../user-profile-update-request.model'
import { UserProfile } from '../user-profile.model'

import { profileStoreGet, profileStorePut } from './profile-store'

export async function get(handle?: string): Promise<UserProfile | undefined> {
    handle = handle || (await tokenGet())?.handle
    return !handle ? Promise.resolve(undefined) : profileStoreGet(handle)
}

export function update(handle: string, profile: UserProfileUpdateRequest): Promise<UserProfileUpdateRequest> {
    return profileStorePut(handle, profile)
}
