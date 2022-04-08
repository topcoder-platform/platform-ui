// TO-DO: uncomment this line and delete the duplicate interface when work provider is in same branch
// import { WorkItem } from '../../lib/work-provider'

interface WorkItem {
    challengeStatus: string,
    created: string,
    id: string,
    initialized: boolean
    messagesCount: number,
    messagesHasNew: boolean,
    name: string,
    numOfRegistrants: number,
    rating: number,
    status: string,
    workStatus: string,
}

const allWork: Array<WorkItem> = []
const categorizedWork: Array<Array<WorkItem>> = [[]]

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

export function setSortColumnForFilter(filter: number, column: number, dir: 'asc' | 'desc'): void {
    // TO-DO sort ticket PROD-1414
}
