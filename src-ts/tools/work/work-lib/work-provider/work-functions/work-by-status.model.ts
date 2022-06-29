import { Work } from './work-factory'

export interface WorkByStatus {
    count: number
    results: ReadonlyArray<Work>
}
