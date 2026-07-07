import {
    deleteAsync,
    getAsync,
    postAsync,
    putAsync,
} from '~/libs/core/lib/xhr/xhr-functions/xhr.functions'

import { Vendor, VendorMutationPayload } from '../models'
import {
    buildProcurementApiUrl,
    normalizeOptionalText,
    normalizeRequiredText,
} from '../utils/api.utils'

/**
 * API helpers for procurement vendor CRUD endpoints.
 */

/**
 * Loads all procurement vendors.
 *
 * @returns Vendors sorted by the backend.
 */
export function getVendors(): Promise<Vendor[]> {
    return getAsync<Vendor[]>(buildProcurementApiUrl('vendors'))
}

/**
 * Creates a procurement vendor.
 *
 * @param payload Editable vendor fields.
 * @returns Created vendor response.
 */
export function createVendor(payload: VendorMutationPayload): Promise<Vendor> {
    return postAsync<VendorMutationPayload, Vendor>(
        buildProcurementApiUrl('vendors'),
        normalizeVendorPayload(payload),
    )
}

/**
 * Deletes a procurement vendor.
 *
 * @param vendorId Vendor identifier to delete.
 * @returns Deleted vendor response.
 */
export function deleteVendor(vendorId: string): Promise<Vendor> {
    return deleteAsync<Vendor>(buildProcurementApiUrl(`vendors/${vendorId}`))
}

/**
 * Replaces editable procurement vendor fields.
 *
 * @param payload Editable vendor fields.
 * @param vendorId Vendor identifier to update.
 * @returns Updated vendor response.
 */
export function updateVendor(vendorId: string, payload: VendorMutationPayload): Promise<Vendor> {
    return putAsync<VendorMutationPayload, Vendor>(
        buildProcurementApiUrl(`vendors/${vendorId}`),
        normalizeVendorPayload(payload),
    )
}

/**
 * Normalizes vendor mutation payloads before xhr submission.
 *
 * @param payload Editable vendor fields.
 * @returns API-ready vendor payload.
 */
function normalizeVendorPayload(payload: VendorMutationPayload): VendorMutationPayload {
    return {
        address: normalizeOptionalText(payload.address),
        category: normalizeOptionalText(payload.category),
        contactEmail: normalizeOptionalText(payload.contactEmail),
        contactName: normalizeOptionalText(payload.contactName),
        contactPhone: normalizeOptionalText(payload.contactPhone),
        name: normalizeRequiredText(payload.name),
        notes: normalizeOptionalText(payload.notes),
    }
}
