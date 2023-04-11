export interface CustomerPaymentRequest {
    amount: number
    currency: 'USD'
    description: string
    paymentMethodId?: string
    receiptEmail: string,
    reference: 'project',
    referenceId?: string
}
