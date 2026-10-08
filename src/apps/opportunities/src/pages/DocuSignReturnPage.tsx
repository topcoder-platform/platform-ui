import { FC, useEffect } from 'react'

import { buildDocuSignReturnMessage } from '../utils/docusign-return.utils'

import styles from './DocuSignReturnPage.module.scss'

/**
 * Receives DocuSign's recipient-view redirect inside the challenge terms iframe.
 *
 * DocuSign navigates its signing frame to this route with the signing outcome in the query
 * string. On mount the page posts `{ ...query, type: 'DocuSign' }` to the embedding terms modal,
 * restricted to this page's own origin, so the modal can confirm the agreement or close. Opened
 * outside a frame, it only tells the member that the DocuSign session has finished.
 *
 * @returns a short status message while the parent modal takes over.
 * @throws Does not throw.
 */
const DocuSignReturnPage: FC = () => {
    const framed = window.parent !== window

    useEffect(() => {
        if (window.parent === window) return
        window.parent.postMessage(buildDocuSignReturnMessage(window.location.search), window.location.origin)
    }, [])

    return (
        <main className={styles.page}>
            <p role='status'>
                {framed
                    ? 'Returning to your challenge terms…'
                    : 'Your DocuSign session has finished. You can close this tab and return to the challenge.'}
            </p>
        </main>
    )
}

export default DocuSignReturnPage
