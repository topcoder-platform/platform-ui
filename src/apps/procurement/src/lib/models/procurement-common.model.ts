/**
 * Shared procurement enum-like frontend types returned by the procurement API.
 */
export type ContractLifecycle = 'active' | 'draft' | 'expired' | 'expiring' | 'terminated'

export type ContractStatus = 'active' | 'draft' | 'expired' | 'terminated'

export type InvoicePaymentState = 'cancelled' | 'draft' | 'overdue' | 'paid' | 'pending'

export type InvoiceStatus = 'cancelled' | 'draft' | 'issued' | 'paid'

export type RenewalStage =
    | 'cio_approval'
    | 'legal_review'
    | 'order_form_signed'
    | 'po_release'
    | 'pr_approvals'
    | 'pr_creation'
    | 'quotation'
    | 'vra'
