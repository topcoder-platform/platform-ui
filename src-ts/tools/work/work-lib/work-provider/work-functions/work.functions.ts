// import { messageGetAndSetForWorkItemsAsync } from '../../functions'
import { Page, UserProfile } from '../../../../../lib'

import { WorkByStatus } from './work-by-status.model'
import { workFactoryBuildCreateBody, workFactoryBuildUpdateBody, workFactoryCreate } from './work-factory'
import {
    Challenge,
    ChallengeCreateBody,
    ChallengeUpdateBody,
    Work,
    workGetPricesConfig,
    WorkPricesType,
    WorkStatus,
    WorkStatusFilter,
    workStoreConfirmCustomerPaymentAsync,
    workStoreCreateAsync,
    workStoreCreateCustomerPaymentAsync,
    workStoreDeleteAsync,
    workStoreGetAsync,
    workStoreGetFilteredByStatus,
    workStoreUpdateAsync,
    WorkType,
    WorkTypeConfig,
    WorkTypeConfigs,
} from './work-store'
import { CustomerPayment } from './work-store/work-customer-payment.model'

export async function createAsync(type: WorkType): Promise<void> {
    const workConfig: WorkTypeConfig = WorkTypeConfigs[type]
    const body: ChallengeCreateBody = workFactoryBuildCreateBody(workConfig)
    return workStoreCreateAsync(body)
}

export function createFromChallenge(challenge: Challenge): Work {
    return workFactoryCreate(challenge, workGetPricesConfig())
}

export async function deleteAsync(workId: string): Promise<void> {
    return workStoreDeleteAsync(workId)
}

export async function createCustomerPayment(body: string): Promise<CustomerPayment> {
    return workStoreCreateCustomerPaymentAsync(body)
}

export async function confirmCustomerPayment(id: string): Promise<CustomerPayment> {
    return workStoreCreateCustomerPaymentAsync(id)
}

export async function getAllAsync(profile: UserProfile): Promise<Array<Work>> {

    // TODO: actual pagination and sorting
    const page: Page = {
        number: 1,
        size: 100,
        sort: {
            direction: 'desc',
            fieldName: 'created',
        },
    }
    let work: Array<Work> = []
    let nextSet: Array<Work> = await getPageAsync((profile as UserProfile).handle, page)

    while (nextSet.length > 0) {
        work = work.concat(nextSet)
        page.number += 1
        nextSet = await getPageAsync((profile as UserProfile).handle, page)
    }

    return work
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

export function getPricesConfig(): WorkPricesType {
    return workGetPricesConfig()
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

export async function updateAsync(type: WorkType, challenge: Challenge, intakeForm: any): Promise<void> {
    const workConfig: WorkTypeConfig = WorkTypeConfigs[type]
    const body: ChallengeUpdateBody = workFactoryBuildUpdateBody(workConfig, challenge, intakeForm)
    return workStoreUpdateAsync(body)
}

async function getPageAsync(handle: string, page: Page): Promise<Array<Work>> {

    // get the response
    const challenges: Array<Challenge> = await workStoreGetAsync(handle, page)

    // run it through the factory and filter out deleted and non-self-service
    const workItems: Array<Work> = challenges
        .map(challenge => workFactoryCreate(challenge, workGetPricesConfig()))
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
