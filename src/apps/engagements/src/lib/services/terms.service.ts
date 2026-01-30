import { EnvironmentConfig } from '~/config'
import { xhrGetAsync, xhrPostAsync } from '~/libs/core'

import type { TermDetails } from '../models'

type AgreeTermsResponse = {
    success?: boolean
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
