import { WorkPrice } from './work-price.model'
import { WorkPricesType } from './work-prices-type.model'
import { WorkPrize } from './work-prize.model'
import { WorkType } from './work-type.enum'

export const WorkPricesConfig: WorkPricesType = {
    // TODO: get real values for bug hunt
    [WorkType.bugHunt]: {
        base: {
            placementDistributions: [0.2609, 0.2174, 0.1304],
            price: 2,
            reviewerDistributions: [0.0435, 0.0435],
        },
        getPrice: getPriceDefault,
        promo: {
            placementDistributions: [0.348, 0.29, 0.174],
            price: 1,
            reviewerDistributions: [0.058, 0.058],
        },
        usePromo: true,
    },
    [WorkType.data]: {
        base: {
            placementDistributions: [0.4, 0.3333, 0.1333],
            price: 799,
            reviewerDistributions: [0.0667, 0.0667],
        },
        getPrice: getPriceDefault,
        promo: {
            placementDistributions: [0.4, 0.3333, 0.1333],
            price: 599,
            reviewerDistributions: [0.0667, 0.0667],
        },
        usePromo: true,
    },
    [WorkType.design]: {
        base: {
            placementDistributions: [0.4, 0.3333, 0.1333],
            price: 499,
            reviewerDistributions: [0.0667, 0.0667],
        },
        getPrice: getPriceDefault,
        perPage: 99,
        promo: {
            placementDistributions: [0.4, 0.3333, 0.1333],
            price: 299,
            reviewerDistributions: [0.0667, 0.0667],
        },
        usePromo: false,
    },
    [WorkType.designLegacy]: {
        base: {
            placementDistributions: [0.5, 0.2, 0.1],
            price: 398,
            reviewerDistributions: [0.1, 0.1],
        },
        getPrice: getPriceDesignLegacy,
        perPage: 99,
        promo: {
            placementDistributions: [0.5, 0.2, 0.1],
            price: 100,
            reviewerDistributions: [0.1, 0.1],
        },
        usePromo: true,
    },
    [WorkType.findData]: {
        base: {
            placementDistributions: [0.2609, 0.2174, 0.1304],
            price: 399,
            reviewerDistributions: [0.0435, 0.0435],
        },
        getPrice: getPriceDefault,
        promo: {
            placementDistributions: [0.348, 0.29, 0.174],
            price: 299,
            reviewerDistributions: [0.058, 0.058],
        },
        usePromo: true,
    },
    [WorkType.problem]: {
        base: {
            placementDistributions: [0.375, 0.3125, 0.125],
            price: 999,
            reviewerDistributions: [0.0625, 0.0625],
        },
        getPrice: getPriceDefault,
        promo: {
            placementDistributions: [0.375, 0.3125, 0.125],
            price: 799,
            reviewerDistributions: [0.0625, 0.0625],
        },
        usePromo: true,
    },
    [WorkType.unknown]: {
        base: {
            placementDistributions: [],
            price: 0,
            reviewerDistributions: [],
        },
        getPrice: () => 0,
        usePromo: false,
    },
}

function getPriceDefault(price: WorkPrice): number {
    return price.usePromo && price.promo?.price ? price.promo?.price : price.base.price
}

function getPriceDesignLegacy(price: WorkPrice, pageCount?: number, deviceCount?: number): number {
    const safePageCount: number = pageCount || 1
    const safeDeviceCount: number = deviceCount || 1
    const basePrice: number = getPriceDefault(price)
    return (basePrice || 1)
        + (safePageCount * (price.perPage || 1))
        + (safePageCount * (safeDeviceCount - 1) * (price.perPage || 1))
}
