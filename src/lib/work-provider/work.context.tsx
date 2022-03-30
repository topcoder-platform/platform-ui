import { Context, createContext } from 'react'
import { WorkContextData } from './work-context-data.model'

export const defaultMyWorkContextData: MyWorkContextData = {
    initialized: false,
}

export const workContext: Context<WorkContextData> = createContext(defaultWorkContextData)
