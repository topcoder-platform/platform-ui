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
    expectedAmount: number
    actualAmount: number
    differenceAmount: number
    ratePerHour: number
    workDays: number
    hoursPerDay: number
    description?: string
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
    status: string
    releaseDate: string
    releaseDateObj: Date
    datePaid: string
    currency: string
    details: PaymentDetail[]
    winnerId?: string
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
}
