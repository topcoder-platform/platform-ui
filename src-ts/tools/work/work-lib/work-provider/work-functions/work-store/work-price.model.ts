import { WorkPrize } from './work-prize.model'

export type PricePackageName = 'base' | 'promo' | 'standard' | 'advanced' | 'premium'

export interface WorkPrice {
    getPrice: (...args: Array<any>) => number,
    getPrizeSets: (price: WorkPrice, packageName?: PricePackageName | undefined) => Array<WorkPrize>,
    packages?: { [key in PricePackageName]?: WorkPriceBreakdown },
    perPage?: number,
    usePromo?: boolean,
}

export interface WorkPriceBreakdown {
    copilotDistributions: ReadonlyArray<number>,
    placementDistributions: ReadonlyArray<number>,
    price: number,
    reviewerDistributions: ReadonlyArray<number>,
}
