import { Work } from './work-functions'

export interface WorkContextData {
    error?: string
    hasWork: boolean
    initialized: boolean
    remove: (workId: string, work: Array<Work>) => void
    work: Array<Work>
}
