import { Page, xhrDeleteAsync, xhrGetAsync, xhrPatchAsync, xhrPostAsync } from '../../../../../../lib'

import { ActivateWorkRequest } from './activate-challenge-request.model'
import { Challenge } from './challenge.model'
import { CreateWorkRequest } from './create-work-request.model'
import { CustomerPaymentRequest } from './customer-payment-request.model'
import { UpdateWorkRequest } from './update-work-request.model'
import { CustomerPayment } from './work-customer-payment.model'
import { WorkStatusFilter } from './work-status-filter.enum'
import { WorkStatus } from './work-status.enum'
import { createPaymentUrl, createUrl, deleteUrl, getUrl, updatePaymentUrl, updateUrl } from './work-url.config'
import { Work } from './work.model'

export async function activateAsync(request: ActivateWorkRequest): Promise<void> {
    return xhrPatchAsync(updateUrl(request.id), JSON.stringify(request))
}

export async function confirmCustomerPaymentAsync(id: string): Promise<CustomerPayment> {
    return xhrPatchAsync(updatePaymentUrl(id), JSON.stringify({}))
}

export async function createAsync(body: CreateWorkRequest): Promise<Challenge> {
    return xhrPostAsync(createUrl(), JSON.stringify(body))
}

export async function createCustomerPaymentAsync(request: CustomerPaymentRequest): Promise<CustomerPayment> {
    return xhrPostAsync(createPaymentUrl(), JSON.stringify(request))
}

export async function deleteAsync(workId: string): Promise<void> {
    return xhrDeleteAsync(deleteUrl(workId))
}

export async function getAsync(handle: string, page: Page): Promise<Array<Challenge>> {
    return xhrGetAsync<Array<Challenge>>(getUrl(handle, page))
}

export async function getByWorkIdAsync(workId: string): Promise<Challenge> {
    return xhrGetAsync<Challenge>(updateUrl(workId))
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

export async function updateAsync(body: UpdateWorkRequest): Promise<void> {
    return xhrPatchAsync(updateUrl(body.id), JSON.stringify(body))
}
