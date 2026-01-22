/**
 * Customer Portal app context model
 */
import { TokenModel } from '~/libs/core'

export interface CustomerPortalAppContextModel {
    loginUserInfo: TokenModel | undefined
}
