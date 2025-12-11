import { createContext } from 'react'

import type { LeaveTrackerContextModel } from '../models'

export const LeaveTrackerContext = createContext<LeaveTrackerContextModel>({
    loginUserInfo: undefined,
})

export default LeaveTrackerContext
