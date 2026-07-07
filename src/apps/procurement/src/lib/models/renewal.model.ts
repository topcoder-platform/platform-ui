import { RenewalStage } from './procurement-common.model'

/**
 * Vendor summary embedded in renewal responses.
 */
export interface RenewalVendorSummary {
    id: string
    name: string
}

/**
 * Contract summary embedded in renewal responses.
 */
export interface RenewalContractSummary {
    contractNumber: string
    id: string
    title: string
    vendor: RenewalVendorSummary
}

/**
 * Renewal read model with backend workflow metadata.
 */
export interface Renewal {
    assignee?: string
    cioApprovalAt?: string
    contract: RenewalContractSummary
    contractId: string
    createdAt: string
    id: string
    legalReviewAt?: string
    newEndDate: string
    newStartDate: string
    newValue?: number | null
    notes?: string
    orderFormSignedAt?: string
    poReleaseAt?: string
    prApprovalsAt?: string
    prCreationAt?: string
    quotationAt?: string
    renewalTermMonths: number
    stage: RenewalStage
    stageLabel: string
    stageOrder: number
    updatedAt: string
    vraAt?: string
}

/**
 * Available renewal workflow stage metadata returned by the API.
 */
export interface RenewalStageMetadata {
    label: string
    order: number
    stage: RenewalStage
    terminal: boolean
}

/**
 * Editable renewal fields accepted by create and update endpoints.
 */
export interface RenewalMutationPayload {
    assignee?: string
    contractId: string
    newEndDate: string
    newStartDate: string
    newValue?: number
    notes?: string
    renewalTermMonths: number
}
