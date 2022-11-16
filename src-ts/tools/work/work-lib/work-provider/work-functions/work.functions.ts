import { PaymentMethodResult, Stripe, StripeCardNumberElement } from '@stripe/stripe-js'

import { FormCard, GenericDataObject, Page, textFormatMoneyLocaleString, UserProfile } from '../../../../../lib'
import BugHuntPricingConfig from '../../../work-self-service/intake-forms/bug-hunt/bug-hunt.form.pricing-config'

import { WorkByStatus } from './work-by-status.model'
import {
    workFactoryBuildActivateRequest,
    workFactoryBuildCreateReqeuest,
    workFactoryBuildCustomerPaymentRequest,
    workFactoryBuildUpdateRequest,
    workFactoryCreate,
} from './work-factory'
import {
    ActivateWorkRequest,
    Challenge,
    CreateWorkRequest,
    CustomerPayment,
    CustomerPaymentRequest,
    PricePackageName,
    UpdateWorkRequest,
    Work,
    workGetPricesConfig,
    WorkPrice,
    WorkPricesType,
    WorkStatus,
    WorkStatusFilter,
    workStoreActivateAsync,
    workStoreConfirmCustomerPaymentAsync,
    workStoreCreateAsync,
    workStoreCreateCustomerPaymentAsync,
    workStoreDeleteAsync,
    workStoreGetAsync,
    workStoreGetByWorkId,
    workStoreGetFilteredByStatus,
    workStoreUpdateAsync,
    WorkType,
    WorkTypeConfig,
    WorkTypeConfigs,
} from './work-store'

export async function createAsync(type: WorkType): Promise<Challenge> {
    const workConfig: WorkTypeConfig = WorkTypeConfigs[type]
    const body: CreateWorkRequest = workFactoryBuildCreateReqeuest(workConfig)
    return workStoreCreateAsync(body)
}

export async function createCustomerPaymentAsync(
    email: string,
    priceConfig: WorkPrice,
    title: string,
    type: WorkType,
    cardNumber?: StripeCardNumberElement | null,
    challenge?: Challenge,
    packageType?: PricePackageName,
    stripe?: Stripe | null,
    workId?: string,
): Promise<void> {

    // if we don't have the bare min, don't do anything
    if (!stripe || !cardNumber || !challenge) {
        return undefined
    }

    // initialize the payment method
    const payload: PaymentMethodResult = await stripe.createPaymentMethod({
        card: cardNumber,
        type: 'card',
    })

    // make the request to make the payment
    const paymentRequest: CustomerPaymentRequest = workFactoryBuildCustomerPaymentRequest(
        `Work Item #${workId}\n${title.slice(0, 355)}}\n${type}`,
        email,
        priceConfig,
        payload.paymentMethod?.id,
        packageType,
        challenge.projectId,
    )
    const response: CustomerPayment = await workStoreCreateCustomerPaymentAsync(paymentRequest)

    // if the response says it requires action, handle it
    if (response?.status === 'requires_action') {
        await stripe.handleCardAction(response.clientSecret)
        await workStoreConfirmCustomerPaymentAsync(response.id)
    }

    // now it's safe to activate the request
    const activationRequest: ActivateWorkRequest = workFactoryBuildActivateRequest(challenge)
    return workStoreActivateAsync(activationRequest)
}

export function createFromChallenge(challenge: Challenge): Work {
    return workFactoryCreate(challenge, workGetPricesConfig())
}

export async function deleteAsync(workId: string): Promise<void> {
    return workStoreDeleteAsync(workId)
}

export async function getAllAsync(profile: UserProfile, pageNumber: number): Promise<Array<Work>> {

    // TODO: actual pagination and sorting
    const page: Page = {
        number: pageNumber,
        size: 100,
        sort: {
            direction: 'desc',
            fieldName: 'created',
        },
    }

    return getPageAsync(profile.handle, page)
}

export async function getByWorkIdAsync(workId: string): Promise<Challenge> {
    return workStoreGetByWorkId(workId)
}

export function getGroupedByStatus(work: ReadonlyArray<Work>): { [status: string]: WorkByStatus } {
    const output: { [status: string]: WorkByStatus } = {}
    Object.entries(WorkStatusFilter)
        .forEach(([key]) => {
            const results: ReadonlyArray<Work> = workStoreGetFilteredByStatus(
                work,
                WorkStatusFilter[key as keyof typeof WorkStatusFilter],
            )
            output[key] = {
                count: results.length,
                messageCount: results.reduce((partialSum, a) => partialSum + (a.messageCount ?? 0), 0),
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
        .find(([key]) => key === filterKey)
        ?.[0] as keyof typeof WorkStatusFilter

    // if the passed in key doesn't match any filter, return undefined;
    // otherwise, return the filter defined by the key
    return !workStatusFilter ? undefined : WorkStatusFilter[workStatusFilter]
}

export async function updateAsync(type: WorkType, challenge: Challenge, intakeForm: GenericDataObject): Promise<void> {
    const workConfig: WorkTypeConfig = WorkTypeConfigs[type]
    const body: UpdateWorkRequest = workFactoryBuildUpdateRequest(workConfig, challenge, intakeForm)
    return workStoreUpdateAsync(body)
}

async function getPageAsync(handle: string, page: Page): Promise<Array<Work>> {

    // get the response
    const challenges: Array<Challenge> = await workStoreGetAsync(handle, page)

    // run it through the factory and filter out deleted and non-self-service
    return challenges
        .map(challenge => workFactoryCreate(challenge, workGetPricesConfig()))
        .filter(work => work.status !== WorkStatus.deleted && work.type !== WorkType.unknown)
}

export function getSelectedPackageFormatted(packageId: string): string {
    const currentPackage: FormCard | undefined
        = BugHuntPricingConfig.find(pricingConfig => pricingConfig.id === packageId)
    if (currentPackage) {
        const deviceType: string = currentPackage.sections?.[0]?.rows?.[3]?.text || ''
        const noOfTesters: string = `${currentPackage.sections?.[0]?.rows?.[2]?.text || 0} testers`
        const price: string | undefined = textFormatMoneyLocaleString(currentPackage.price)
        return `${currentPackage.title} - ${price} - ${deviceType} - ${noOfTesters}`
    }

    return packageId
}
