import { EnvironmentConfig } from '~/config'
import { xhrGetAsync, xhrPostAsync } from '~/libs/core'

import type { TermDetails } from '../models'

type AgreeTermsResponse = {
    success?: boolean
}

type DocuSignResponse = {
    recipientViewUrl?: string
}

const LEGACY_TERM_PATTERN = /^[\d]{5,8}$/

export const getTermDetails = async (termId: string): Promise<TermDetails> => {
    if (LEGACY_TERM_PATTERN.test(termId)) {
        const response = await xhrGetAsync<{ result?: TermDetails[] }>(
            `${EnvironmentConfig.API.V5}/terms?legacyId=${termId}`,
        )
        const term = response?.result?.[0]
        if (!term) {
            throw new Error('Term not found')
        }

        return term
    }

    return xhrGetAsync<TermDetails>(`${EnvironmentConfig.API.V5}/terms/${termId}`)
}

export const agreeToTerm = async (termId: string): Promise<AgreeTermsResponse> => (
    xhrPostAsync<Record<string, never>, AgreeTermsResponse>(
        `${EnvironmentConfig.API.V5}/terms/${termId}/agree`,
        {},
    )
)

export const getDocuSignUrl = async (
    templateId: string | number,
    returnUrl: string,
): Promise<string> => {
    const response = await xhrPostAsync<{ returnUrl: string; templateId: string | number }, DocuSignResponse>(
        `${EnvironmentConfig.API.V5}/terms/docusignViewURL`,
        { returnUrl, templateId },
    )

    if (!response?.recipientViewUrl) {
        throw new Error('DocuSign URL missing')
    }

    return response.recipientViewUrl
}
