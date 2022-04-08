import { WorkItem } from '../../lib/work-provider'
import { applySort, WorkSortDefinition } from './WorkSorter'

const allWork: Array<WorkItem> = []
const categorizedWork: Array<Array<WorkItem>> = [[]]
const sortDefinitions: Array<WorkSortDefinition> = []

export function setAllWork(work: Array<WorkItem>): void {
    allWork.length = 0
    allWork.push(...work)
    allWork.forEach((workItem: WorkItem) => {
        // TO-DO get correct field into WorkItem and update API call
       categorizedWork[workItem.rating].push(workItem)
    })
}

export function getFilteredWork(filter: number): Array<WorkItem> {
    return categorizedWork[filter]
}

export function setSortColumnForFilter(filter: number, col: number, dir: 'asc' | 'desc'): void {
    const def: WorkSortDefinition = {
        column: col,
        order: dir,
    }
    applySort(categorizedWork[filter], def)
    sortDefinitions[filter] = def
}
