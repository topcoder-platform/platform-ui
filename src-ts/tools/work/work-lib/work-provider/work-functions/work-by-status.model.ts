import { Work } from './work-store'

export interface WorkByStatus {
    count: number
    messageCount: number
    results: ReadonlyArray<Work>
}
