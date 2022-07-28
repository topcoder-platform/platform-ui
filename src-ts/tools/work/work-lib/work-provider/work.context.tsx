import { Context, createContext } from 'react'

import { WorkContextData } from './work-context-data.model'

export const defaultWorkContextData: WorkContextData = {
    hasWork: false,
    initialized: false,
    refresh: () => undefined,
    work: [],
}

export const workContext: Context<WorkContextData> = createContext(defaultWorkContextData)

export default workContext
