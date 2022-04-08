import { WorkItem } from '../../lib/work-provider'

// TO-DO add WorkSortDefinitions to WorkFilter so it remembers per column sorts
export interface WorkSortDefinition {
    column: number
    order: 'asc' | 'desc'
}

export function applySort(list: Array<WorkItem>, definition: WorkSortDefinition): void {
    list.sort(
        (a: WorkItem, b: WorkItem): number => {
            let result: number = 0
            if (definition.column === 0) {
                result = a.challengeStatus.localeCompare(b.challengeStatus)
            }
            if (definition.column === 1) {
                result = a.workStatus.localeCompare(b.workStatus)
            }
            if (definition.column === 2) {
                result = a. created.localeCompare(b.created)
            }
            // TO-DO where is solutions ready
            // TO-DO no cost yet
            // TO-DO are we sorting on title?
            if (definition.order === 'desc') {
                result = -result
            }
            return result
        })
}
