import { UserPatchRequest, userStoreGetDiceStatusAsync, userStorePatchAsync } from './user-store'

export async function getDiceStatusAsync(userId: number): Promise<boolean> {
    return userStoreGetDiceStatusAsync(userId)
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
