// import { messageGetAndSetForWorkItemsAsync } from '../../functions'
import { Page } from '../../../../../lib'

import { WorkByStatus } from './work-by-status.model'
import { Work, workFactoryCreate, WorkStatus, WorkType } from './work-factory'
import { Challenge, WorkPrices, WorkStatusFilter, workStoreDeleteAsync, workStoreGetAsync, workStoreGetFilteredByStatus } from './work-store'

export async function deleteAsync(workId: string): Promise<void> {
    return workStoreDeleteAsync(workId)
}

export async function getAsync(handle: string, page: Page): Promise<Array<Work>> {

    // get the response
    const challenges: Array<Challenge> = await workStoreGetAsync(handle, page)

    // run it through the factory and filter out deleted and non-self-service
    const workItems: Array<Work> = challenges
        .map(challenge => workFactoryCreate(challenge, WorkPrices))
        .filter(work => work.status !== WorkStatus.deleted && work.type !== WorkType.unknown)

    return workItems

    /*
        TODO: add this data back to the work object when the bug is fixed:
        https://topcoder.atlassian.net/browse/PROD-1860
        Unread Messages count from API don't match embedded forum widget
    // get and set the messages counts and return
    return messageGetAndSetForWorkItemsAsync(workItems, handle)
    */
}

export function getGroupedByStatus(work: ReadonlyArray<Work>): { [status: string]: WorkByStatus } {

    const output: { [status: string]: WorkByStatus } = {}
    Object.entries(WorkStatusFilter)
        .forEach(([key, value]) => {
            const results: ReadonlyArray<Work> = workStoreGetFilteredByStatus(work, WorkStatusFilter[key as keyof typeof WorkStatusFilter])
            output[key] = {
                count: results.length,
                results,
            }
        })

    return output
}

export function getStatusFilter(filterKey?: string): WorkStatusFilter | undefined {

    // if there is no filter, default to active status
    if (!filterKey) {
        return WorkStatusFilter.active
    }

    // get the filter key from the passed in key
    const workStatusFilter: keyof typeof WorkStatusFilter | undefined = Object.entries(WorkStatusFilter)
        .find(([key, value]) => key === filterKey)
        ?.[0] as keyof typeof WorkStatusFilter

    // if the passed in key doesn't match any filter, return undefined;
    // otherwise, return the filter defined by the key
    return !workStatusFilter ? undefined : WorkStatusFilter[workStatusFilter]
}
