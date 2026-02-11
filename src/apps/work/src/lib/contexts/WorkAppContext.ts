import { Context, createContext } from 'react'
import { noop } from 'lodash'

import { WorkAppContextModel } from '../models'

noop()

export const WorkAppContext: Context<WorkAppContextModel>
    = createContext<WorkAppContextModel>({
        isAdmin: false,
        isAnonymous: true,
        isCopilot: false,
        isManager: false,
        isReadOnly: false,
        loginUserInfo: undefined,
        userRoles: [],
    })
