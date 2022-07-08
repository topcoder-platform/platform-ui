import { Work } from './work-functions'

export interface WorkContextData {
    error?: string
    hasWork: boolean
    initialized: boolean
    refresh: () => void
    work: Array<Work>
}
