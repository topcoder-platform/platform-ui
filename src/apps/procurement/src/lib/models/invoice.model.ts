import { InvoicePaymentState, InvoiceStatus } from './procurement-common.model'

/**
 * Contract summary embedded in invoice responses.
 */
export interface InvoiceContractSummary {
    contractNumber: string
    id: string
    title: string
}

/**
 * Vendor summary embedded in invoice responses.
 */
export interface InvoiceVendorSummary {
    id: string
    name: string
}

/**
 * Invoice read model with stored status and backend-derived payment state.
 */
export interface Invoice {
    amount: number
    contract?: InvoiceContractSummary
    contractId?: string
    createdAt: string
    description?: string
    dueDate: string
    id: string
    invoiceDate: string
    invoiceNumber: string
    paidDate?: string
    paymentState: InvoicePaymentState
    status: InvoiceStatus
    updatedAt: string
    vendor: InvoiceVendorSummary
    vendorId: string
}

/**
 * Editable invoice fields accepted by create and update endpoints.
 */
export interface InvoiceMutationPayload {
    amount: number
    contractId?: string
    description?: string
    dueDate: string
    invoiceDate: string
    invoiceNumber: string
    paidDate?: string
    status?: InvoiceStatus
    vendorId: string
}
