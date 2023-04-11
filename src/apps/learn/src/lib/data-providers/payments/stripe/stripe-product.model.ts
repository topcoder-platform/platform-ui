import { StripePrice } from './stripe-price.model'

export interface StripeProduct {
    id: string
    active: boolean
    attributes: string[]
    created: number
    description: string
    default_price: StripePrice
    prices: {
        data: StripePrice[]
    }
    metadata: Record<string, any>
}

export interface StripeProductData {
    loading: boolean
    product: StripeProduct | undefined
    ready: boolean
}
