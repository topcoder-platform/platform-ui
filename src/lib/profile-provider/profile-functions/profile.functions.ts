import { tokenGet } from '../../functions/token-functions'
import { UserProfileDetail } from '../user-profile-detail.model'
import { UserProfile } from '../user-profile.model'

import { profileStoreGet, profileStorePut } from './profile-store'

export async function get(handle?: string): Promise<UserProfileDetail | undefined> {
    handle = handle || (await tokenGet())?.handle
    return !handle ? Promise.resolve(undefined) : profileStoreGet(handle)
}

export async function update(handle: string, profile: UserProfile): Promise<UserProfile | undefined> {
    return profileStorePut(handle, profile)
}
