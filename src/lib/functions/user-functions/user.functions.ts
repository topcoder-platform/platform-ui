import { User } from '../../../../types/tc-auth-lib'

import { patch as userPatch } from './user-store'

export async function update(user: User): Promise<User | undefined> {
    return userPatch(user)
}
