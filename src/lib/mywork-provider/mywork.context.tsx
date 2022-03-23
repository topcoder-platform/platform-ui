import { Context, createContext } from 'react'

import { MyWorkContextData } from './mywork-context-data.model'

export const defaultMyWorkContextData: MyWorkContextData = {
    initialized: false,
}

export const MyWorkContext: Context<MyWorkContextData> = createContext(defaultMyWorkContextData)

