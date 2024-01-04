export interface PaymentProvider {
    type: 'Payoneer' | 'Paypal'
    name: 'Payoneer' | 'Paypal'
    description: string
    status: string
}

export interface SetPaymentProviderResponse {
    transactionId: string
    registrationLink: string
}
