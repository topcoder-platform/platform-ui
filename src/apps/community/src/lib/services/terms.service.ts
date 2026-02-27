import { EnvironmentConfig } from '~/config'
import { xhrGetAsync, xhrPostAsync } from '~/libs/core'

import {
    type BackendTerm,
    convertBackendTerm,
    type TermInfo,
} from '../models'

const termsBaseUrl = `${EnvironmentConfig.API.V6}`

/**
 * DocuSign view url response.
 */
export interface DocuSignResponse {
    envelopeId: string
    recipientViewUrl: string
}

/**
 * Fetches full details for a term.
 *
 * @param termId Term identifier.
 * @returns Converted term details.
 */
export const fetchTermDetails = async (termId: string): Promise<TermInfo> => {
    const response = await xhrGetAsync<BackendTerm>(`${termsBaseUrl}/terms/${termId}`)

    return convertBackendTerm(response)
}

/**
 * Fetches all term details for a challenge in parallel.
 *
 * @param termIds Term identifiers.
 * @returns Converted term list.
 */
export const fetchTermsForChallenge = async (
    termIds: string[],
): Promise<TermInfo[]> => Promise.all(termIds.map(fetchTermDetails))

/**
 * Records agreement for a term.
 *
 * @param termId Term identifier.
 * @returns Agreement result.
 */
export const agreeTerm = async (
    termId: string,
): Promise<{ success: boolean }> => {
    const response = await xhrPostAsync<Record<string, never>, { success?: boolean }>(
        `${termsBaseUrl}/terms/${termId}/agree`,
        {},
    )

    return {
        success: response.success === true,
    }
}

/**
 * Fetches a DocuSign recipient view URL for a template.
 *
 * @param templateId DocuSign template id.
 * @param returnUrl Optional callback url after signing.
 * @returns DocuSign view payload.
 */
export const fetchDocuSignUrl = async (
    templateId: string,
    returnUrl?: string,
): Promise<DocuSignResponse> => {
    const response = await xhrPostAsync<{
        returnUrl?: string
        templateId: string
    }, DocuSignResponse>(
        `${termsBaseUrl}/terms/docusignViewURL`,
        {
            returnUrl,
            templateId,
        },
    )

    return response
}
