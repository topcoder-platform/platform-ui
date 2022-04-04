import { workList } from './work-functions'

export interface WorkContextData {
    initialized: boolean
    work?: workList
}
