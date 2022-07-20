import { WorkPrize } from './work-prize.model'

export type PricePackageName = 'base' | 'promo' | 'standard' | 'advanced' | 'premium'

export interface WorkPrice {
    // getPrice: ((price: WorkPrice, pageCount?: number, deviceCount?: number) => number) |
    // ((price: WorkPrice, packageName: PricePackageName) => number),
    getPrice: any,
    getPrizeSets: (price: WorkPrice, packageName?: PricePackageName | undefined) => Array<WorkPrize>,
    packages?: { [key in PricePackageName]?: WorkPriceBreakdown },
    perPage?: number,
    usePromo?: boolean,
}

export interface WorkPriceBreakdown {
    placementDistributions: ReadonlyArray<number>,
    price: number,
    reviewerDistributions: ReadonlyArray<number>,
}
