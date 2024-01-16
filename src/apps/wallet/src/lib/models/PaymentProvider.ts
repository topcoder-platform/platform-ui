export interface PaymentProvider {
    id?: number
    upmId?: string
    type: 'Payoneer' | 'Paypal'
    name: 'Payoneer' | 'Paypal'
    description: string
    status: string
    transactionId?: string
}
