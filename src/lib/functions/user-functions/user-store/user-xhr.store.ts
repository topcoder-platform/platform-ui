import { User } from '../../../../../types/tc-auth-lib'
import { patch as xhrPatch } from '../../xhr-functions'

import { user as userEndpoint } from './user-endpoint.config'

export async function patch(user: User): Promise<User> {
    const url: string = userEndpoint(user.userId)
    return xhrPatch(url, user)
}
