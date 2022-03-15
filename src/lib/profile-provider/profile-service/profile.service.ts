import { get as tokenGet } from '../../services/token-service'
import { UserProfileDetail } from '../user-profile-detail.model'
import { UserProfile } from '../user-profile.model'

import { get as storeGet, put as storePut } from './profile-store'

export async function get(handle?: string): Promise<UserProfileDetail | undefined> {
    handle = handle || (await tokenGet())?.handle
    return !handle ? Promise.resolve(undefined) : storeGet(handle)
}

export async function update(handle: string, profile: UserProfile): Promise<UserProfile | undefined> {
    return storePut(handle, profile)
}
