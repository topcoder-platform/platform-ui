export interface PaymentDetail {
    id: string
    netAmount: string
    grossAmount: string
    totalAmount: string
    installmentNumber: number
    status: string
    currency: string
    datePaid: string
}

export interface Winning {
    id: string
    description: string
    externalId: string
    type: string
    handle: string;
    createDate: string
    netPayment: string
    netPaymentNumber: number
    status: string
    releaseDate: string
    releaseDateObj: Date
    datePaid: string
    currency: string
    details: PaymentDetail[]
}

export interface WinningDetail {
    id: string
    type: string
    handle: string
    winnerId: string
    origin: string
    category: string
    title: string
    description: string
    externalId: string
    attributes: {
        url: string
    }
    details: PaymentDetail[]
    createdAt: string
    releaseDate: string
    datePaid: string
}
