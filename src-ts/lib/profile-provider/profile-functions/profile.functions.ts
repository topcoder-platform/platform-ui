import { userGetDiceStatusAsync } from '../../functions/user-functions'
import { tokenGetAsync, TokenModel } from '../../functions/token-functions'
import { EditNameRequest } from '../edit-name-request.model'
import { UserProfile } from '../user-profile.model'

import { profileFactoryCreate } from './profile-factory'
import { profileStoreGet, profileStorePatchName } from './profile-store'

export async function getLoggedInAsync(handle?: string): Promise<UserProfile | undefined> {

    // get the token
    const token: TokenModel = await tokenGetAsync()

    // get the handle
    const safeHandle: string | undefined = handle || token.handle
    if (!safeHandle || !token.userId) {
        return Promise.resolve(undefined)
    }

    // get the profile
    const profilePromise: Promise<UserProfile> = profileStoreGet(safeHandle)
    const dicePromise: Promise<boolean> = userGetDiceStatusAsync(token.userId)

    const [profileResult, diceEnabled]: [UserProfile, boolean] = await Promise.all([profilePromise, dicePromise])

    // make the changes we need based on the token
    const output: UserProfile = profileFactoryCreate(profileResult, token, diceEnabled)
    return output
}

export async function getPublicAsync(handle: string): Promise<UserProfile | undefined> {

    // get the profile
    const profileResult: UserProfile = await profileStoreGet(handle)

    const output: UserProfile = profileFactoryCreate(profileResult)
    return output
}

export async function editNameAsync(handle: string, profile: EditNameRequest): Promise<UserProfile> {
    return profileStorePatchName(handle, profile)
}
