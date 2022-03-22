import { userPatchAsync, UserPatchRequest } from './user-store'

export async function updatePasswordAsync(userId: number, currentPassword: string, password: string): Promise<void> {
    const request: UserPatchRequest = {
        param: {
            credential: {
                currentPassword,
                password,
            },
        },
    }
    return userPatchAsync(userId, request)
        .then(() => undefined)
}
