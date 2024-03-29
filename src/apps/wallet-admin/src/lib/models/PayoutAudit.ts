export interface PayoutAudit {
    externalTransactionId: string
    status: string
    totalNetAmount: number
    createdAt: string
    metadata: string
    paymentMethodUsed: string
    externalTransactionDetails: any
}
