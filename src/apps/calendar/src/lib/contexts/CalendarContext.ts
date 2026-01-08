import { createContext } from 'react'

import type { CalendarContextModel } from '../models'

export const CalendarContext = createContext<CalendarContextModel>({
    loginUserInfo: undefined,
})

export default CalendarContext
