import { Page, xhrDeleteAsync, xhrGetAsync, xhrPatchAsync, xhrPostAsync } from '../../../../../../lib'

import { Challenge, ChallengeCreateBody, ChallengeUpdateBody } from './challenge.model'
import { WorkStatusFilter } from './work-status-filter.enum'
import { WorkStatus } from './work-status.enum'
import { createUrl, deleteUrl, getUrl, updateUrl } from './work-url.config'
import { Work } from './work.model'

export async function createAsync(body: ChallengeCreateBody): Promise<void> {
    return xhrPostAsync(createUrl(), JSON.stringify(body))
}

export async function deleteAsync(workId: string): Promise<void> {
    return xhrDeleteAsync(deleteUrl(workId))
}

export async function getAsync(handle: string, page: Page): Promise<Array<Challenge>> {
    return xhrGetAsync<Array<Challenge>>(getUrl(handle, page))
}

export function getFilteredByStatus(work: ReadonlyArray<Work>, workStatusFilter?: WorkStatusFilter): Array<Work> {
    // this is implemented in the work store
    // bc in the future we might actually want
    // to make an api call to filter
    return work
        // if there is a workstatusfilter, filter the results;
        .filter(w => !!workStatusFilter
            && (workStatusFilter === WorkStatusFilter.all
                || w.status === WorkStatus[workStatusFilter as keyof typeof WorkStatus]))
}

export async function updateAsync(workId: string, body: ChallengeUpdateBody): Promise<void> {
    return xhrPatchAsync(updateUrl(workId), JSON.stringify(body))
}
