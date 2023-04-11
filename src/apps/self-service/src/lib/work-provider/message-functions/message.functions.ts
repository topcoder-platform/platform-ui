import { logError } from '~/libs/core'
import { Work, WorkStatus } from '../work-functions'

import { GetUnreadMessageCountResponse, messageStoreGetUnreadCountAsync } from './message-store'

export async function getAndSetForWorkItemsAsync(workItems: Array<Work>, handle: string): Promise<Array<Work>> {

    // create a list of promises
    const requestsList: Array<Promise<GetUnreadMessageCountResponse>> = workItems
        .filter(work => work.status === WorkStatus.active)
        .map(work => messageStoreGetUnreadCountAsync(work.id, handle)
            .catch(() => ({
                workId: work.id,
            })))

    // resolve all the promises
    const results: Array<GetUnreadMessageCountResponse> = await Promise.all(requestsList)

    // create a map of the results
    const resultsMap: { [workId: string]: GetUnreadMessageCountResponse } = {}
    results.forEach(item => { resultsMap[item.workId] = item })

    // map the messages to the work items
    return workItems
        .map(work => {
            work.messageCount = resultsMap[work.id]?.messageCount
            return work
        })
}

export async function getUnreadCountAsync(workId: string, handle: string): Promise<number | undefined> {
    try {
        const response: GetUnreadMessageCountResponse = await messageStoreGetUnreadCountAsync(workId, handle)
        return response.messageCount
    } catch (err: any) {
        logError(err)
        return undefined
    }
}
