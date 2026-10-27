export enum WinningsType {
  PAYMENT = 'PAYMENT',
  ENGAGEMENT = 'ENGAGEMENT',
  POINTS = 'POINTS',
}

export interface PaymentDetail {
    id: string
    grossAmount: string
    totalAmount: string
    installmentNumber: number
    status: string
    currency: string
    datePaid: string
}

export interface DuplicateRelease {
    releaseId: string
    status: string | null
    createdAt: string
    amount: string
    externalTransactionId: string | null
}

/**
 * A payment row included in more than one PROCESSING/PROCESSED release,
 * i.e. the member was (or is being) paid for it more than once.
 */
export interface DuplicatePaymentReleases {
    paymentId: string
    installmentNumber: number
    /** Active releases containing the payment, oldest first. */
    releases: DuplicateRelease[]
}

export interface PayoutStatus {
    payoutSetupComplete: boolean;
    taxFormSetupComplete: boolean;
    idVerificationComplete?: boolean;
}

export interface PaymentEngagementDetails {
    assignmentId?: string
    engagementId?: string
    projectId?: string
    projectName?: string
    engagementTitle?: string
    billingStartDate?: string
    durationMonths?: number
    paymentCycle?: string
    ratePerHour?: string
    standardHoursPerDay?: number
    standardHoursPerWeek?: number
    otherRemarks?: string
    paymentApproverHandle?: string
}

export interface PaymentWorkLog {
    hoursWorked?: number
    remarks?: string
}

export interface PaymentTaskDetails {
    projectId?: string
    projectName?: string
    paymentApproverHandle?: string
    paymentCreatorHandle?: string
    taskDescription?: string
}

export type PaymentAgreementStatus = 'match' | 'under' | 'over'

export interface PaymentAgreementSummary {
    status: PaymentAgreementStatus
    actualAmount: number
    differenceAmount: number
    expectedAmount: number
    expectedAmountMax?: number
    hoursPerDay: number
    paymentCycle: string
    ratePerHour: number
    workDays: number
}

export interface WinningPaymentDetails {
    agreementSummary?: PaymentAgreementSummary
    engagementDetails?: PaymentEngagementDetails
    paymentCreatorHandle?: string
    workLog?: PaymentWorkLog
    taskDetails?: PaymentTaskDetails
}

export interface Winning {
    assignmentId?: string
    id: string
    description: string
    externalId: string
    type: string
    handle: string;
    createDate: string
    grossAmount: string
    grossAmountNumber: number
    /** Formatted payment total, including billing markup, shown in the payments listing. */
    totalAmount: string
    /** Numeric payment total, including billing markup, backing {@link Winning.totalAmount}. */
    totalAmountNumber: number
    status: string
    releaseDate: string
    releaseDateObj: Date
    datePaid: string
    currency: string
    details: PaymentDetail[]
    winnerId?: string
    /** Payments of this winning released more than once (double payment). */
    duplicateReleases?: DuplicatePaymentReleases[]
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
    /** Gross member amount across current installments; absent on older Finance deployments. */
    grossAmount?: number
    /** Payment total including billing markup; absent on older Finance deployments. */
    totalAmount?: number
    externalId: string
    attributes: {
        assignmentId?: number | string
        hoursWorked?: number | string
        remarks?: string
        url?: string
    }
    details: PaymentDetail[]
    createdAt: string
    releaseDate: string
    datePaid: string
    paymentStatus?: PayoutStatus
    /** Admin search only; absent on older Finance deployments. */
    duplicateReleases?: DuplicatePaymentReleases[]
}
