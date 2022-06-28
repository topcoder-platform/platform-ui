import { Context, createContext } from 'react'

import { WorkContextData } from './work-context-data.model'
import { workFactoryCreate, workFactoryGetStatus } from './work-functions'

export const defaultWorkContextData: WorkContextData = {
    createFromChallenge: workFactoryCreate,
    deleteWorkAsync: () => Promise.resolve(),
    getStatusFromChallenge: workFactoryGetStatus,
    hasWork: false,
    initialized: false,
    work: [],
}

export const workContext: Context<WorkContextData> = createContext(defaultWorkContextData)

export default workContext
