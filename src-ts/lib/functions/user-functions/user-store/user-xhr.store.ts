import { User } from '../../../../../types/tc-auth-lib'
import { xhrGetAsync, xhrPatchAsync } from '../../xhr-functions'

import { user as userEndpoint } from './user-endpoint.config'

export interface UserPatchRequest {
    param: {
        credential: {
            currentPassword: string
            password: string
        }
    }
}

export async function getDiceStatusAsync(userId: number): Promise<boolean> {

    interface DiceStatusResult {
        result: {
            content: {
                diceEnabled: boolean
            }
        }
    }
    const result: DiceStatusResult
        = await xhrGetAsync<DiceStatusResult>(`${userEndpoint(userId)}/2fa`)

    return !!result.result.content.diceEnabled
}

export async function patchAsync(userId: number, request: UserPatchRequest): Promise<User> {
    const url: string = userEndpoint(userId)
    return xhrPatchAsync(url, request)
}
