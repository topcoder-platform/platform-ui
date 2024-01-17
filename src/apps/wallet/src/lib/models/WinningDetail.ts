export interface PaymentDetail {
    id: string
    netAmount: string
    grossAmount: string
    totalAmount: string
    installmentNumber: number
    status: string
    currency: string
}

export interface Winning {
    id: string
    description: string
    type: string
    createDate: string
    netPayment: string
    status: string
    releaseDate: string
    datePaid: string
    canBeReleased: boolean
    currency: string
    details: PaymentDetail[]
}

export interface WinningDetail {
    id: string
    type: string
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
