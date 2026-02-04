/**
 * Customer Portal app context definition.
 */
import { Context, createContext } from 'react'

import { CustomerPortalAppContextModel } from '../models'

export const CustomerPortalAppContext: Context<CustomerPortalAppContextModel>
    = createContext<CustomerPortalAppContextModel>({
        loginUserInfo: undefined,
    })
