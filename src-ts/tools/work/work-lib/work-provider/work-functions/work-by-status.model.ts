import { Work } from './work-store'

export interface WorkByStatus {
    count: number
    results: ReadonlyArray<Work>
}
