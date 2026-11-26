export type ActionLogType =
    | 'STATUS_CHANGE'
    | 'AMOUNT_CHANGE'
    | 'RELEASE_DATE_CHANGE'
    | 'DESCRIPTION_CHANGE'
    | 'OTHER'

/**
 * A payment change made manually in Wallet Admin, as listed in the Action Log
 * report, as returned by tc-finance-api. Payment fields hold the current state
 * of the payment.
 */
export interface ActionLogEntry {
    auditId: string
    actionedAt: string
    adminUserId: string
    actionType: ActionLogType
    action: string
    note: string | null
    winningId: string
    winnerId: string
    winningsType: string
    category: string | null
    title: string | null
    externalId: string | null
    paymentId: string | null
    totalAmount: string | null
    paymentStatus: string | null
    releaseDate: string | null
    datePaid: string | null
}

/** Payment source as split in Wallet Admin; see tc-finance-api. */
export type ActionLogPaymentSource = 'TOPCODER' | 'TAAS' | 'TOPGEAR'

/** Filters for the Action Log report. */
export interface ActionLogFilters {
    /** Start of the range, inclusive. */
    dateFrom: Date
    /** End of the range, inclusive. */
    dateTo: Date
    paymentSource?: ActionLogPaymentSource
    /** Winnings categories (payment types) to include; all when empty. */
    categories?: string[]
    adminUserId?: string
}

export interface MemberContact {
    userId: number
    handle: string
    email?: string
    firstName?: string
    lastName?: string
}

/**
 * An action log entry with the admin and member details looked up from the
 * members API.
 */
export interface ActionLogRow extends ActionLogEntry {
    adminHandle?: string
    adminEmail?: string
    adminName?: string
    winnerHandle?: string
}
