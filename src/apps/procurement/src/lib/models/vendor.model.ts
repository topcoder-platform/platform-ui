/**
 * Vendor read model returned by procurement vendor endpoints.
 */
export interface Vendor {
    address?: string
    category?: string
    contactEmail?: string
    contactName?: string
    contactPhone?: string
    createdAt: string
    id: string
    name: string
    notes?: string
    updatedAt: string
}

/**
 * Editable vendor fields accepted by create and update endpoints.
 */
export interface VendorMutationPayload {
    address?: string
    category?: string
    contactEmail?: string
    contactName?: string
    contactPhone?: string
    name: string
    notes?: string
}
