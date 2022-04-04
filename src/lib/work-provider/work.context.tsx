import { Context, createContext } from 'react'
import { WorkContextData } from './work-context-data.model'

export const defaultWorkContextData: WorkContextData = {
    initialized: false,
}

export const workContext: Context<WorkContextData> = createContext(defaultWorkContextData)

