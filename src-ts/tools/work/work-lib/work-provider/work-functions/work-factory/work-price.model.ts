export interface WorkPrice {
    base: number,
    getPrice: (price: WorkPrice, pageCount?: number, deviceCount?: number) => number,
    perPage?: number,
    promo?: number,
    usePromo?: boolean,
}
