import { tokenGetAsync, TokenModel } from '../../functions/token-functions'
import { EditNameRequest } from '../edit-name-request.model'
import { UserProfile } from '../user-profile.model'

import { profileFactoryCreate } from './profile-factory'
import { profileStoreGet, profileStorePatchName } from './profile-store'

export async function getAsync(handle?: string): Promise<UserProfile | undefined> {

    // get the token
    const token: TokenModel = await tokenGetAsync()

    // get the handle
    const safeHandle: string | undefined = handle || token?.handle
    if (!safeHandle) {
        return Promise.resolve(undefined)
    }

    // get the profile
    const profileResult: UserProfile = await profileStoreGet(safeHandle)

    // make the changes we need based on the token
    const output: UserProfile = profileFactoryCreate(profileResult, token)
    return output
}

export async function editNameAsync(handle: string, profile: EditNameRequest): Promise<any> {
    return profileStorePatchName(handle, profile)
}
