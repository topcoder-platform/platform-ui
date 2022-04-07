import { WorkItem } from './WorkItem.model'

export interface WorkList {
    handle: string
    page: Page
    workItems: Array<WorkItem>
}

interface Page {
    pageNumber: number // starts at 1
    pageSize: number
    sort: Sort
}

interface Sort {
    fieldName: string
    direction: 'asc' | 'desc'
}

