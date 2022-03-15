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
    // TODO: figure out why this a Bad Request
    // when it's exactly like the request used
    // in the self-service app
    return patchUser(userId, request)
        .then(() => undefined)
}
