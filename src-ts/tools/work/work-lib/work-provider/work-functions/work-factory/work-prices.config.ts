import { WorkPrice } from './work-price.model'
import { WorkType } from './work-type.enum'

export const WorkPrices: { [workType: string]: WorkPrice } = {
    [WorkType.data]: {
        base: 799,
        getPrice: getPriceDefault,
        promo: 599,
        usePromo: true,
    },
    [WorkType.design]: {
        base: 499,
        getPrice: getPriceDesign,
        perPage: 99,
        promo: 299,
        usePromo: false,
    },
    [WorkType.designLegacy]: {
        base: 398,
        getPrice: getPriceDesign,
        perPage: 99,
        promo: 100,
        usePromo: false,
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

export const data: WorkPrice = WorkPrices[WorkType.data]
export const design: WorkPrice = WorkPrices[WorkType.design]
export const designLegacy: WorkPrice = WorkPrices[WorkType.designLegacy]
export const findData: WorkPrice = WorkPrices[WorkType.findData]
export const problem: WorkPrice = WorkPrices[WorkType.problem]

function getPriceDefault(price: WorkPrice): number {
    return price.usePromo && price.promo ? price.promo : price.base
}

function getPriceDesign(price: WorkPrice, pageCount?: number, deviceCount?: number): number {
    const safePageCount: number = pageCount || 1
    const safeDeviceCount: number = deviceCount || 1
    return (price.promo || 1)
        + (safePageCount * (price.perPage || 1))
        + (safePageCount * (safeDeviceCount - 1) * (price.perPage || 1))
}
