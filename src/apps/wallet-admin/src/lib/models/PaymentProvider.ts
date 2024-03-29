export interface PaymentProvider {
    id?: number
    upmId?: string
    userId: string
    type: 'Payoneer' | 'Paypal'
    name: 'Payoneer' | 'Paypal'
    status: string
    handle?: string
    providerId: string
}
