import { xhrPatchAsync } from '../../../xhr'
import { AuthUser } from '../../authentication-functions/auth-user.model'

import { user as userEndpoint } from './user-endpoint.config'

export interface UserPatchRequest {
    param: {
        credential: {
            currentPassword: string
            password: string
        }
    }
}

export async function patchAsync(userId: number, request: UserPatchRequest): Promise<AuthUser> {
    const url: string = userEndpoint(userId)
    return xhrPatchAsync(url, request)
}
