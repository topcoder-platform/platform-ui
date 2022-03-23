import { User } from '../../../../../types/tc-auth-lib'
<<<<<<< HEAD
import { patch as xhrPatch } from '../../xhr-functions'
=======
import { xhrPatchAsync } from '../../xhr-functions'
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22

import { user as userEndpoint } from './user-endpoint.config'

export interface UserPatchRequest {
    param: {
        credential: {
            currentPassword: string
            password: string
        }
    }
}

<<<<<<< HEAD
export async function patchUser(userId: number, request: UserPatchRequest): Promise<User> {
    const url: string = userEndpoint(userId)
    return xhrPatch(url, request)
=======
export async function patchAsync(userId: number, request: UserPatchRequest): Promise<User> {
    const url: string = userEndpoint(userId)
    return xhrPatchAsync(url, request)
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22
}
