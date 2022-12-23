import { UserPatchRequest, userStoreGetMfaStatusAsync, userStorePatchAsync } from './user-store'
import { MfaStatusResult } from './user-store/user-xhr.store'

export async function getDiceStatusAsync(userId: number): Promise<boolean> {
    const result: MfaStatusResult = await userStoreGetMfaStatusAsync(userId)
    return !!result.result.content.mfaEnabled && !!result.result.content.diceEnabled
}

export async function updatePasswordAsync(userId: number, currentPassword: string, password: string): Promise<void> {
    const request: UserPatchRequest = {
        param: {
            credential: {
                currentPassword,
                password,
            },
        },
    }
    return userStorePatchAsync(userId, request)
        .then(() => undefined)
}
