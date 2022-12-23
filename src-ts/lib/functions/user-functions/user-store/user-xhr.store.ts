import { User } from '../../../../../types/tc-auth-lib'
import { xhrGetAsync, xhrPatchAsync } from '../../xhr-functions'

import { user as userEndpoint } from './user-endpoint.config'

export interface MfaStatusResult {
    result: {
        content: {
            diceEnabled: boolean
            mfaEnabled: boolean
        }
    }
}

export interface UserPatchRequest {
    param: {
        credential: {
            currentPassword: string
            password: string
        }
    }
}

export async function getMfaStatusAsync(userId: number): Promise<MfaStatusResult> {
    return xhrGetAsync<MfaStatusResult>(`${userEndpoint(userId)}/2fa`)
}

export async function patchAsync(userId: number, request: UserPatchRequest): Promise<User> {
    const url: string = userEndpoint(userId)
    return xhrPatchAsync(url, request)
}
