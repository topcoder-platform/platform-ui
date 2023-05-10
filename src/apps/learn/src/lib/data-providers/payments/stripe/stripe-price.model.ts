export interface StripePrice {
    id: string
    active: boolean
    created: number
    unit_amount: number
    currency: string
    metadata: Record<string, any>
}
