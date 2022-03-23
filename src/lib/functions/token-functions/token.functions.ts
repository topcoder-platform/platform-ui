import { decodeToken } from 'tc-auth-lib'

<<<<<<< HEAD
import { authenticate } from '../authentication-functions'
=======
import { authInitializeAsync } from '../authentication-functions'
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22
import { logError } from '../logging-functions'

import { TokenModel } from './token.model'

<<<<<<< HEAD
export async function get(): Promise<TokenModel> {

    const token: string | undefined = await authenticate()
=======
export async function getAsync(): Promise<TokenModel> {

    const token: string | undefined = await authInitializeAsync()
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22

    // if there is no token, no need to try to get the handle
    if (!token) {
        return Promise.resolve({})
    }

    try {
        const { handle }: { handle?: string } = decodeToken(token)

        // if we didn't find the handle, we have a bad token
        if (!handle) {
            logError(`token did not have a handle: ${token}`)
            return Promise.resolve({})
        }

        return Promise.resolve({ handle, token })

    } catch (error: any) {
        logError(error)
        return Promise.resolve({})
    }
}
