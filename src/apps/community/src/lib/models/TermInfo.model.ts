/**
 * Raw term payload from `GET /terms/:id`.
 */
export interface BackendTerm {
    agreeabilityType: string
    agreed: boolean
    docusignTemplateId?: string
    id: string
    legacyId?: number
    text?: string
    title?: string
    url?: string
}

/**
 * Term data consumed by the community app.
 */
export interface TermInfo {
    agreeabilityType: string
    agreed: boolean
    docusignTemplateId?: string
    id: string
    legacyId?: number
    text?: string
    title?: string
    url?: string
}

/**
 * Converts backend term payload to the frontend term model.
 *
 * @param data Raw term payload.
 * @returns Converted term model.
 */
export function convertBackendTerm(data: BackendTerm): TermInfo {
    return {
        ...data,
    }
}
