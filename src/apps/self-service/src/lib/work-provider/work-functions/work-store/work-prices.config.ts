import { PricePackageName, WorkPrice, WorkPriceBreakdown } from './work-price.model'
import { WorkPricesType } from './work-prices-type.model'
import { WorkPrize } from './work-prize.model'
import { WorkType } from './work-type.enum'

export const WorkPricesConfig: WorkPricesType = {
    [WorkType.bugHunt]: {
        getPrice: getPriceBugHunt,
        getPrizeSets,
        packages: {
            advanced: {
                copilotDistributions: [0.2106],
                placementDistributions: [0.2106, 0.1316, 0.0789, 0.037, 0.016],
                price: 1899,
                reviewerDistributions: [],
            },
            premium: {
                copilotDistributions: [0.2175],
                placementDistributions: [0.2175, 0.1305, 0.087, 0.03045, 0.013],
                price: 2299,
                reviewerDistributions: [],
            },
            standard: {
                copilotDistributions: [0.2],
                placementDistributions: [0.2, 0.1334, 0.067, 0.047, 0.02],
                price: 1499,
                reviewerDistributions: [],
            },
        },
        usePromo: false,
    },
    [WorkType.data]: {
        getPrice: getPriceDefault,
        getPrizeSets,
        packages: {
            base: {
                copilotDistributions: [],
                placementDistributions: [0.4, 0.3333, 0.1333],
                price: 799,
                reviewerDistributions: [0.0667, 0.0667],
            },
            promo: {
                copilotDistributions: [],
                placementDistributions: [0.4, 0.3333, 0.1333],
                price: 599,
                reviewerDistributions: [0.0667, 0.0667],
            },
        },
        usePromo: true,
    },
    [WorkType.design]: {
        getPrice: getPriceDefault,
        getPrizeSets,
        packages: {
            base: {
                copilotDistributions: [],
                placementDistributions: [0.4, 0.3333, 0.1333],
                price: 499,
                reviewerDistributions: [0.0667, 0.0667],
            },
            promo: {
                copilotDistributions: [],
                placementDistributions: [0.4, 0.3333, 0.1333],
                price: 299,
                reviewerDistributions: [0.0667, 0.0667],
            },
        },
        perPage: 99,
        usePromo: false,
    },
    [WorkType.designLegacy]: {
        getPrice: getPriceDesignLegacy,
        getPrizeSets,
        packages: {
            base: {
                copilotDistributions: [],
                placementDistributions: [0.5, 0.2, 0.1],
                price: 398,
                reviewerDistributions: [0.1, 0.1],
            },
            promo: {
                copilotDistributions: [],
                placementDistributions: [0.5, 0.2, 0.1],
                price: 100,
                reviewerDistributions: [0.1, 0.1],
            },
        },
        perPage: 99,
        usePromo: true,
    },
    [WorkType.findData]: {
        getPrice: getPriceDefault,
        getPrizeSets,
        packages: {
            base: {
                copilotDistributions: [],
                placementDistributions: [0.2609, 0.2174, 0.1304],
                price: 399,
                reviewerDistributions: [0.0435, 0.0435],
            },
            promo: {
                copilotDistributions: [],
                placementDistributions: [0.348, 0.29, 0.174],
                price: 299,
                reviewerDistributions: [0.058, 0.058],
            },
        },
        usePromo: true,
    },
    [WorkType.problem]: {
        getPrice: getPriceDefault,
        getPrizeSets,
        packages: {
            base: {
                copilotDistributions: [],
                placementDistributions: [0.375, 0.3125, 0.125],
                price: 999,
                reviewerDistributions: [0.0625, 0.0625],
            },
            promo: {
                copilotDistributions: [],
                placementDistributions: [0.375, 0.3125, 0.125],
                price: 799,
                reviewerDistributions: [0.0625, 0.0625],
            },
        },
        usePromo: true,
    },
    [WorkType.unknown]: {
        getPrice: () => 0,
        getPrizeSets,
        packages: {
            base: {
                copilotDistributions: [],
                placementDistributions: [],
                price: 0,
                reviewerDistributions: [],
            },
        },
        usePromo: false,
    },
}

function getPriceBugHunt(priceConfig: WorkPrice, packageName: PricePackageName): number {
    return priceConfig.packages?.[packageName]?.price || 0
}

function getPriceDefault(priceConfig: WorkPrice): number {
    return priceConfig.usePromo && priceConfig.packages?.promo
        ? priceConfig.packages?.promo?.price
        : priceConfig.packages?.base?.price || 0
}

function getPriceDesignLegacy(price: WorkPrice, pageCount?: number, deviceCount?: number): number {
    const safePageCount: number = pageCount || 1
    const safeDeviceCount: number = deviceCount || 1
    const basePrice: number = getPriceDefault(price)
    return (basePrice || 1)
        + (safePageCount * (price.perPage || 1))
        + (safePageCount * (safeDeviceCount - 1) * (price.perPage || 1))
}

function getPrizeSets(priceConfig: WorkPrice, packageNameParam?: PricePackageName | undefined): Array<WorkPrize> {
    const packageName: PricePackageName = packageNameParam ?? (priceConfig.usePromo ? 'promo' : 'base')

    const pricePackage: WorkPriceBreakdown | undefined = priceConfig.packages?.[packageName]

    if (!pricePackage) { return [] }

    const prizeSets: Array<WorkPrize> = [
        {
            description: 'Challenge Prizes',
            prizes: pricePackage.placementDistributions.map(percentage => ({
                type: 'USD',
                value: Math.round(percentage * pricePackage.price),
            })),
            type: 'placement',
        },
        {
            description: 'Reviewer Payment',
            prizes:
                pricePackage.reviewerDistributions.map(percentage => ({
                    type: 'USD',
                    value: Math.round(percentage * pricePackage.price),
                })),
            type: 'reviewer',
        },
        {
            description: 'Copilot Prizes',
            prizes: pricePackage.copilotDistributions?.map(percentage => ({
                type: 'USD',
                value: Math.round(percentage * pricePackage.price),
            })),
            type: 'copilot',
        },
    ]

    return prizeSets.filter(set => set.prizes.length)
}
