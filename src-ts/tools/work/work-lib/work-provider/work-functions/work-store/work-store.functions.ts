import { Page, xhrDeleteAsync, xhrGetAsync, xhrPostAsync } from '../../../../../../lib'
import { Work, WorkStatus } from '../work-factory'

import { Challenge, ChallengeCreate } from './challenge.model'
import { WorkStatusFilter } from './work-status-filter.enum'
import { createUrl, deleteUrl, getUrl } from './work-url.config'

export async function createAsync(body: ChallengeCreate): Promise<void> {
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
