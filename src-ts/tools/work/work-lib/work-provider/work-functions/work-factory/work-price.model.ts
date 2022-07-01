export interface WorkPrice {
    base: number,
    getPrice: (price: WorkPrice, pageCount?: number, deviceCount?: number) => number,
    payments?: {
        base?: {
            prizes: ReadonlyArray<number>,
            reviewers: ReadonlyArray<number>,
        },
        promo?: {
            prizes: ReadonlyArray<number>,
            reviewers: ReadonlyArray<number>,
        },
    },
    perPage?: number,
    promo?: number,
    usePromo?: boolean,
}
