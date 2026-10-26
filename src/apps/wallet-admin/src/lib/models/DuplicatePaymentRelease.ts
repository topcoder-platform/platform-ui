export interface DuplicateSharedWinning {
    winningId: string
    title: string | null
    amount: string
}

/**
 * Two active payment releases that contain the same payments.
 * `release1` is the older release of the pair.
 */
export interface DuplicatePaymentRelease {
    userId: string
    handle: string | null
    release1Id: string
    release2Id: string
    release1Status: string | null
    release2Status: string | null
    release1CreatedAt: string
    release2CreatedAt: string
    release1Amount: string
    release2Amount: string
    trolleyPayment1Id: string | null
    trolleyPayment2Id: string | null
    sharedPayments: number
    sharedAmount: string
    sharedWinnings: DuplicateSharedWinning[]
}
