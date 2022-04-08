import { WorkList } from './work-functions'

export interface WorkContextData {
    initialized: boolean
    work?: WorkList
}
