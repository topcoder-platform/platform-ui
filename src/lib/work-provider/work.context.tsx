import { Context, createContext } from 'react'
import { WorkContextData } from './work-context-data.model'

export const defaultMyWorkContextData: MyWorkContextData = {
    initialized: false,
}

export const WorkContext: Context<WorkContextData> = createContext(defaultWorkContextData)

