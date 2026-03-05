/**
 * Reports app context definition.
 */
import { Context, createContext } from 'react'

import { TokenModel } from '~/libs/core'

export interface ReportsAppContextModel {
    loginUserInfo: TokenModel | undefined
}

export const ReportsAppContext: Context<ReportsAppContextModel>
    = createContext<ReportsAppContextModel>({
        loginUserInfo: undefined,
    })
