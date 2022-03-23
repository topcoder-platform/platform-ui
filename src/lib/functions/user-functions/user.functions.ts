<<<<<<< HEAD
import { patchUser, UserPatchRequest } from './user-store'

export async function updatePassword(userId: number, currentPassword: string, password: string): Promise<void> {
=======
import { userPatchAsync, UserPatchRequest } from './user-store'

export async function updatePasswordAsync(userId: number, currentPassword: string, password: string): Promise<void> {
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22
    const request: UserPatchRequest = {
        param: {
            credential: {
                currentPassword,
                password,
            },
        },
    }
<<<<<<< HEAD
    return patchUser(userId, request)
=======
    return userPatchAsync(userId, request)
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22
        .then(() => undefined)
}
