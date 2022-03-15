import { User } from '../../../../../types/tc-auth-lib'
import { patch as xhrPatch } from '../../xhr-functions'

import { user as userEndpoint } from './user-endpoint.config'

export interface UserPatchRequest {
    param: {
        credential: {
            currentPassword: string
            password: string
        }
    }
}

export async function patchUser(userId: number, request: UserPatchRequest): Promise<User> {
    const url: string = userEndpoint(userId)
    return xhrPatch(url, request)
}
