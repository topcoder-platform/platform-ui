import { patchUser, UserPatchRequest } from './user-store'

export async function updatePassword(userId: number, currentPassword: string, password: string): Promise<void> {
    const request: UserPatchRequest = {
        param: {
            credential: {
                currentPassword,
                password,
            },
        },
    }
    return patchUser(userId, request)
        .then(() => undefined)
}
