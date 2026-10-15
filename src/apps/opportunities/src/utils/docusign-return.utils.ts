import { AppSubdomain, EnvironmentConfig } from '~/config'

/** Route below the Opportunities root that DocuSign redirects its signing iframe to. */
export const DOCUSIGN_RETURN_ROUTE = 'terms/docusign-return'

/** Message type the challenge terms modal accepts from the DocuSign return frame. */
export const DOCUSIGN_MESSAGE_TYPE = 'DocuSign'

/** Message posted from the DocuSign return frame to the terms modal. */
export type DocuSignReturnMessage = Record<string, string> & { type: typeof DOCUSIGN_MESSAGE_TYPE }

/**
 * Builds the absolute DocuSign return URL served by this Opportunities deployment.
 *
 * The URL uses the current browser origin so the return frame is same-origin with the
 * challenge terms modal that embeds it; it replaces community-app's
 * `/community-app-assets/iframe-break` endpoint. The Terms service passes it to DocuSign
 * as the recipient-view return URL.
 *
 * @param origin browser origin that hosts the terms modal; defaults to the current window.
 * @returns the `/opportunities/terms/docusign-return` URL, or `/terms/docusign-return` on the
 * dedicated opportunities subdomain.
 * @throws Does not throw.
 */
export function buildDocuSignReturnUrl(origin: string = window.location.origin): string {
    const root = EnvironmentConfig.SUBDOMAIN === AppSubdomain.opportunities ? '' : '/opportunities'
    return `${origin.replace(/\/$/, '')}${root}/${DOCUSIGN_RETURN_ROUTE}`
}

/**
 * Converts the query string DocuSign appends to the return URL into the terms-modal message.
 *
 * DocuSign reports the outcome in the `event` parameter (for example `signing_complete`,
 * `viewing_complete`, `decline`, or `cancel`). Every query value is forwarded as a string, as
 * community-app did, and the fixed `type` cannot be overridden by the query.
 *
 * @param search current `window.location.search` of the return frame.
 * @returns message object with `type: 'DocuSign'` and the forwarded query values.
 * @throws Does not throw.
 */
export function buildDocuSignReturnMessage(search: string): DocuSignReturnMessage {
    const message: Record<string, string> = {}
    new URLSearchParams(search)
        .forEach((value, key) => {
            if (key !== 'type') message[key] = value
        })
    return { ...message, type: DOCUSIGN_MESSAGE_TYPE }
}
