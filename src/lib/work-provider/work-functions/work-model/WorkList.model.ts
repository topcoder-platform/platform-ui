import { WorkItem } from './WorkItem.model'

export interface WorkList {
    handle: string
    page: number
    perPage: number
    workItems: Array<WorkItem>
}
