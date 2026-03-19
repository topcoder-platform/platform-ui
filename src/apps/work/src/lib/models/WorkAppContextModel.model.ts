import { TokenModel } from '~/libs/core'

export interface WorkAppContextModel {
    loginUserInfo: TokenModel | undefined
    userRoles: string[]
    isAdmin: boolean
    isCopilot: boolean
    isManager: boolean
    isReadOnly: boolean
    isAnonymous: boolean
}
