import { WorkPrice } from './work-price.model'
import { WorkType } from './work-type.enum'

export const WorkPrices: { [workType: string]: WorkPrice } = {
    // TODO: get real values for bug hunt
    [WorkType.bugHunt]: {
        base: 2,
        getPrice: getPriceDefault,
        payments: {
            base: {
                prizes: [0.2609, 0.2174, 0.1304],
                reviewers: [0.0435, 0.0435],
            },
            promo: {
                prizes: [0.348, 0.29, 0.174],
                reviewers: [0.058, 0.058],
            }
        },
        promo: 1,
        usePromo: true,
    },
    [WorkType.data]: {
        base: 799,
        getPrice: getPriceDefault,
        promo: 599,
        usePromo: true,
    },
    [WorkType.design]: {
        base: 499,
        getPrice: getPriceDefault,
        perPage: 99,
        promo: 299,
        usePromo: false,
    },
    [WorkType.designLegacy]: {
        base: 398,
        getPrice: getPriceDesignLegacy,
        perPage: 99,
        promo: 100,
        usePromo: true,
    },
    [WorkType.findData]: {
        base: 399,
        getPrice: getPriceDefault,
        promo: 299,
        usePromo: true,
    },
    [WorkType.problem]: {
        base: 999,
        getPrice: getPriceDefault,
        promo: 799,
        usePromo: true,
    },
    [WorkType.unknown]: {
        base: 0,
        getPrice: () => 0,
        usePromo: false,
    },
}

export const bugHunt: WorkPrice = WorkPrices[WorkType.bugHunt]
export const data: WorkPrice = WorkPrices[WorkType.data]
export const design: WorkPrice = WorkPrices[WorkType.design]
export const designLegacy: WorkPrice = WorkPrices[WorkType.designLegacy]
export const findData: WorkPrice = WorkPrices[WorkType.findData]
export const problem: WorkPrice = WorkPrices[WorkType.problem]

function getPriceDefault(price: WorkPrice): number {
    return price.usePromo && price.promo ? price.promo : price.base
}

function getPriceDesignLegacy(price: WorkPrice, pageCount?: number, deviceCount?: number): number {
    const safePageCount: number = pageCount || 1
    const safeDeviceCount: number = deviceCount || 1
    const basePrice: number = getPriceDefault(price)
    return (basePrice || 1)
        + (safePageCount * (price.perPage || 1))
        + (safePageCount * (safeDeviceCount - 1) * (price.perPage || 1))
}
