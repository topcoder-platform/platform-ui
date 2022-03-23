<<<<<<< HEAD
import { get as tokenGet } from '../../functions/token-functions'
import { UserProfileDetail } from '../user-profile-detail.model'
import { UserProfile } from '../user-profile.model'

import { get as storeGet, put as storePut } from './profile-store'

export async function get(handle?: string): Promise<UserProfileDetail | undefined> {
    handle = handle || (await tokenGet())?.handle
    return !handle ? Promise.resolve(undefined) : storeGet(handle)
}

export async function update(handle: string, profile: UserProfile): Promise<UserProfile | undefined> {
    return storePut(handle, profile)
=======
import { tokenGetAsync } from '../../functions/token-functions'
import { UserProfileUpdateRequest } from '../user-profile-update-request.model'
import { UserProfile } from '../user-profile.model'

import { profileStoreGet, profileStorePut } from './profile-store'

export async function getAsync(handle?: string): Promise<UserProfile | undefined> {
    handle = handle || (await tokenGetAsync())?.handle
    return !handle ? Promise.resolve(undefined) : profileStoreGet(handle)
}

export async function updateAsync(handle: string, profile: UserProfileUpdateRequest): Promise<UserProfile> {
    return profileStorePut(handle, profile)
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22
}
