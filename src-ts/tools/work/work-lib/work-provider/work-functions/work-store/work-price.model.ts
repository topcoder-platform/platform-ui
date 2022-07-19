export interface WorkPrice {
    base: WorkPriceBreakdown,
    getPrice: (price: WorkPrice, pageCount?: number, deviceCount?: number) => number,
    perPage?: number,
    promo?: WorkPriceBreakdown,
    usePromo?: boolean,
}

export interface WorkPriceBreakdown {
    placementDistributions: ReadonlyArray<number>,
    price: number,
    reviewerDistributions: ReadonlyArray<number>,
}
