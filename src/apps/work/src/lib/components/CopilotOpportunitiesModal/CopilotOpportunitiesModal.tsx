import {
    FC,
    MouseEvent,
    useCallback,
} from 'react'

import { LoadingSpinner } from '~/libs/ui'

import { COPILOTS_APP_URL } from '../../constants'
import {
    useFetchProjectCopilotOpportunities,
    UseFetchProjectCopilotOpportunitiesResult,
} from '../../hooks'
import type { CopilotOpportunity } from '../../models'
import { formatDate } from '../../utils/date.utils'

import styles from './CopilotOpportunitiesModal.module.scss'

export interface CopilotOpportunitiesModalProps {
    onClose: () => void
    projectId: string
}

/**
 * Builds the Copilots app deep link for one opportunity.
 *
 * @param opportunityId identifier of the opportunity to open.
 * @returns absolute Copilots app URL for the opportunity details page.
 * @throws Does not throw.
 */
export function buildCopilotOpportunityUrl(opportunityId: string): string {
    return `${COPILOTS_APP_URL.replace(/\/$/, '')}/opportunity/${encodeURIComponent(opportunityId)}`
}

/**
 * Resolves the label shown for one opportunity link.
 *
 * Opportunity titles come from the originating copilot request and are optional,
 * so the identifier is used whenever a request was saved without a title.
 *
 * @param opportunity opportunity being rendered.
 * @returns a non-empty link label.
 * @throws Does not throw.
 */
export function getCopilotOpportunityLabel(opportunity: CopilotOpportunity): string {
    const title = (opportunity.opportunityTitle || '').trim()

    return title || `Copilot Opportunity #${opportunity.id}`
}

/**
 * Lists the copilot opportunities created for one project as links into the
 * Copilots app.
 *
 * Rendered from the project challenges page when a manager or admin selects the
 * "View Request" action next to "Request Copilot", so copilot requests raised
 * for the project can be followed up on without leaving the Work app first.
 *
 * @param props owning project and the handler that dismisses the modal.
 * @returns the modal element.
 * @throws Does not throw; load failures render an inline message.
 */
export const CopilotOpportunitiesModal: FC<CopilotOpportunitiesModalProps> = (
    props: CopilotOpportunitiesModalProps,
) => {
    const {
        error,
        isLoading,
        opportunities,
    }: UseFetchProjectCopilotOpportunitiesResult = useFetchProjectCopilotOpportunities(props.projectId)

    const handleContainerClick = useCallback((event: MouseEvent<HTMLDivElement>): void => {
        event.stopPropagation()
    }, [])

    return (
        <div className={styles.overlay} onClick={props.onClose} role='presentation'>
            <div
                aria-modal='true'
                aria-label='Copilot Requests'
                className={styles.container}
                onClick={handleContainerClick}
                role='dialog'
            >
                <header className={styles.header}>
                    <h4 className={styles.title}>Copilot Requests</h4>
                    <button
                        aria-label='Close'
                        className={styles.closeButton}
                        onClick={props.onClose}
                        type='button'
                    >
                        ×
                    </button>
                </header>

                <div className={styles.body}>
                    {isLoading
                        ? (
                            <div className={styles.loadingWrap}>
                                <LoadingSpinner inline />
                            </div>
                        )
                        : undefined}

                    {!isLoading && error
                        ? <p className={styles.message}>Unable to load copilot requests.</p>
                        : undefined}

                    {!isLoading && !error && opportunities.length === 0
                        ? <p className={styles.message}>No copilot requests found for this project.</p>
                        : undefined}

                    {!isLoading && !error && opportunities.length > 0
                        ? (
                            <ul className={styles.list}>
                                {opportunities.map(opportunity => (
                                    <li className={styles.listItem} key={opportunity.id}>
                                        <a
                                            className={styles.opportunityLink}
                                            href={buildCopilotOpportunityUrl(opportunity.id)}
                                            rel='noreferrer noopener'
                                            target='_blank'
                                        >
                                            {getCopilotOpportunityLabel(opportunity)}
                                        </a>
                                        <span className={styles.meta}>
                                            {opportunity.status || 'unknown'}
                                            {' · '}
                                            {formatDate(opportunity.createdAt)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )
                        : undefined}
                </div>
            </div>
        </div>
    )
}

export default CopilotOpportunitiesModal
