export type ResolvedTermsConfig = {
    id?: string
    url?: string
}

type TermsTemplateDetails = {
    docusignTemplateId?: string | number
    title?: string
}

const NDA_TITLE_PATTERN = /\bnda\b|non[-\s]?disclosure/i

/**
 * Extracts the trailing terms identifier from a terms detail URL or path.
 *
 * @param termsUrl - Full terms URL, relative path, or plain slash-delimited terms path.
 * @returns The trailing terms identifier, or undefined when the input is empty.
 */
export const extractTermId = (termsUrl?: string): string | undefined => {
    if (!termsUrl) {
        return undefined
    }

    const trimmed = termsUrl.trim()
    if (!trimmed) {
        return undefined
    }

    try {
        const parsed = new URL(trimmed)
        const parts = parsed.pathname.split('/')
            .filter(Boolean)
        return parts[parts.length - 1]
    } catch {
        const parts = trimmed.split('/')
            .filter(Boolean)
        return parts[parts.length - 1]
    }
}

/**
 * Rewrites an existing terms detail URL so it points at the supplied terms identifier.
 *
 * @param termsUrl - Current terms detail URL or path used as the URL template.
 * @param termId - Terms identifier that should replace the trailing URL segment.
 * @returns A terms detail URL for the supplied identifier, or the original URL when it cannot be rewritten.
 */
export const replaceTermIdInUrl = (
    termsUrl?: string,
    termId?: string,
): string | undefined => {
    const trimmedTermId = termId?.trim()
    if (!termsUrl || !trimmedTermId) {
        return termsUrl
    }

    const trimmedTermsUrl = termsUrl.trim()
    if (!trimmedTermsUrl) {
        return undefined
    }

    try {
        const parsed = new URL(trimmedTermsUrl)
        const parts = parsed.pathname.split('/')
            .filter(Boolean)

        if (parts.length === 0) {
            return trimmedTermsUrl
        }

        parts[parts.length - 1] = trimmedTermId
        parsed.pathname = `/${parts.join('/')}`
        return parsed.toString()
    } catch {
        const parts = trimmedTermsUrl.split('/')
            .filter(Boolean)

        if (parts.length === 0) {
            return trimmedTermsUrl
        }

        parts[parts.length - 1] = trimmedTermId
        return parts.join('/')
    }
}

/**
 * Resolves the Standard Terms ID and detail URL used by engagement agreement checks.
 *
 * @param defaultStandardTermsId - Preferred Standard Terms UUID from environment configuration.
 * @param termsUrl - Fallback Standard Terms detail URL.
 * @returns The resolved Standard Terms identifier and a matching detail URL.
 */
export const resolveStandardTermsConfig = (
    defaultStandardTermsId?: string,
    termsUrl?: string,
): ResolvedTermsConfig => {
    const id = defaultStandardTermsId?.trim() || extractTermId(termsUrl)

    return {
        id,
        url: replaceTermIdInUrl(termsUrl, id),
    }
}

/**
 * Checks whether a terms record represents an NDA-style agreement.
 *
 * @param term - Terms API details or search result payload.
 * @returns true when the term title is NDA/non-disclosure related.
 */
export const isNdaTerm = (term?: TermsTemplateDetails): boolean => (
    NDA_TITLE_PATTERN.test(term?.title ?? '')
)

/**
 * Resolves the DocuSign template id for a terms record.
 *
 * @param term - Terms API details or search result payload.
 * @param configuredNdaTemplateId - Preferred DocuSign template id for NDA terms.
 * @returns The configured NDA template id for NDA terms, otherwise the Terms API template id.
 */
export const resolveDocuSignTemplateId = (
    term?: TermsTemplateDetails,
    configuredNdaTemplateId?: string,
): string | number | undefined => {
    const normalizedConfiguredNdaTemplateId = configuredNdaTemplateId?.trim()

    if (normalizedConfiguredNdaTemplateId && isNdaTerm(term)) {
        return normalizedConfiguredNdaTemplateId
    }

    return term?.docusignTemplateId
}
