import {
    deleteAsync,
    getAsync,
    postAsync,
    putAsync,
} from '~/libs/core/lib/xhr/xhr-functions/xhr.functions'

import { Invoice, InvoiceMutationPayload, InvoicePaymentState } from '../models'
import {
    buildProcurementApiUrl,
    normalizeDateOnly,
    normalizeOptionalText,
    normalizeRequiredText,
} from '../utils/api.utils'

export type InvoiceStateFilter = Extract<InvoicePaymentState, 'overdue' | 'paid' | 'pending'>

/**
 * API helpers for procurement invoice endpoints.
 */

/**
 * Creates a procurement invoice.
 *
 * @param payload Editable invoice fields.
 * @returns Created invoice response.
 */
export function createInvoice(payload: InvoiceMutationPayload): Promise<Invoice> {
    return postAsync<InvoiceMutationPayload, Invoice>(
        buildProcurementApiUrl('invoices'),
        normalizeInvoicePayload(payload),
    )
}

/**
 * Deletes a procurement invoice.
 *
 * @param invoiceId Invoice identifier to delete.
 * @returns Deleted invoice response.
 */
export function deleteInvoice(invoiceId: string): Promise<Invoice> {
    return deleteAsync<Invoice>(buildProcurementApiUrl(`invoices/${invoiceId}`))
}

/**
 * Loads procurement invoices, optionally filtered by backend-derived payment state.
 *
 * @param state Optional payment-state filter.
 * @returns Invoices sorted by the backend.
 */
export function getInvoices(state?: InvoiceStateFilter): Promise<Invoice[]> {
    return getAsync<Invoice[]>(buildProcurementApiUrl('invoices', { state }))
}

/**
 * Loads overdue procurement invoices for urgent dashboard tables.
 *
 * @returns Overdue invoices sorted by the backend.
 */
export function getOverdueInvoices(): Promise<Invoice[]> {
    return getAsync<Invoice[]>(buildProcurementApiUrl('invoices/overdue'))
}

/**
 * Replaces editable procurement invoice fields.
 *
 * @param invoiceId Invoice identifier to update.
 * @param payload Editable invoice fields.
 * @returns Updated invoice response.
 */
export function updateInvoice(invoiceId: string, payload: InvoiceMutationPayload): Promise<Invoice> {
    return putAsync<InvoiceMutationPayload, Invoice>(
        buildProcurementApiUrl(`invoices/${invoiceId}`),
        normalizeInvoicePayload(payload),
    )
}

/**
 * Normalizes invoice mutation payloads before xhr submission.
 *
 * @param payload Editable invoice fields.
 * @returns API-ready invoice payload.
 */
function normalizeInvoicePayload(payload: InvoiceMutationPayload): InvoiceMutationPayload {
    return {
        amount: payload.amount,
        contractId: normalizeOptionalText(payload.contractId),
        description: payload.description === undefined ? undefined : payload.description.trim(),
        dueDate: normalizeDateOnly(payload.dueDate) || payload.dueDate,
        invoiceDate: normalizeDateOnly(payload.invoiceDate) || payload.invoiceDate,
        invoiceNumber: normalizeRequiredText(payload.invoiceNumber),
        paidDate: normalizeDateOnly(payload.paidDate),
        status: payload.status,
        vendorId: payload.vendorId,
    }
}
