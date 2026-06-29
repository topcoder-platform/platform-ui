import { ContractLifecycle, ContractStatus } from './procurement-common.model'

/**
 * Vendor summary embedded in contract responses.
 */
export interface ContractVendorSummary {
    category?: string
    id: string
    name: string
}

/**
 * Contract read model with stored status and backend-derived lifecycle.
 */
export interface Contract {
    autoRenew: boolean
    contractNumber: string
    createdAt: string
    description?: string
    endDate: string
    id: string
    lifecycle: ContractLifecycle
    renewalNoticeDays?: number | null
    startDate: string
    status: ContractStatus
    title: string
    updatedAt: string
    value: number
    vendor: ContractVendorSummary
    vendorId: string
}

/**
 * Editable contract fields accepted by create and update endpoints.
 */
export interface ContractMutationPayload {
    autoRenew?: boolean
    contractNumber: string
    description?: string
    endDate: string
    renewalNoticeDays?: number
    startDate: string
    status?: ContractStatus
    title: string
    value: number
    vendorId: string
}
