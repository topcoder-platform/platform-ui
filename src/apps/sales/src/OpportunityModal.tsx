import { FC, useEffect, useState } from 'react'

import { BaseModal, Button, LoadingSpinner } from '~/libs/ui'

import {
    fetchOpportunity,
    opportunityErrorMessage,
    SalesOpportunity,
} from './opportunity.service'
import { workProjectUrl } from './sales.utils'
import styles from './OpportunityModal.module.scss'

export interface OpportunityModalProps {
    /** Salesforce opportunity id taken from the report cell. */
    opportunityId: string
    /** Opportunity name shown while the details are still loading. */
    opportunityName: string
    onClose: () => void
    open: boolean
}

type ModalState =
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'ready'; opportunity: SalesOpportunity }

/**
 * Shows the details of one Salesforce opportunity, starting with its description.
 * When a billing account exists, also shows its ID/name, the Work challenges
 * link, and past accounts used by the project, excluding the current account.
 * @param props The opportunity to load, whether the popup is open, and the close handler.
 * @returns A dialog closed with either the Close button or the X icon.
 * @throws Does not throw request failures; shows the sanitized message inline.
 */
export const OpportunityModal: FC<OpportunityModalProps> = props => {
    const [state, setState] = useState<ModalState>({ status: 'loading' })

    useEffect(() => {
        if (!props.open) {
            return undefined
        }

        const controller = new AbortController()
        setState({ status: 'loading' })
        fetchOpportunity(props.opportunityId, controller.signal)
            .then(opportunity => {
                if (!controller.signal.aborted) {
                    setState({ opportunity, status: 'ready' })
                }
            })
            .catch(error => {
                if (!controller.signal.aborted) {
                    setState({ message: opportunityErrorMessage(error), status: 'error' })
                }
            })

        return () => controller.abort()
    }, [props.open, props.opportunityId])

    const opportunity = state.status === 'ready' ? state.opportunity : undefined
    const billingAccount = opportunity?.billingAccount
    const projectUrl = billingAccount ? workProjectUrl(opportunity?.projectId) : undefined
    const pastBillingAccounts = (opportunity?.relatedBillingAccounts ?? [])
        .filter(account => account.id !== billingAccount?.id)
    const details: Array<{ label: string; value: string | undefined }> = [
        { label: 'Customer', value: opportunity?.customer },
        { label: 'SMU', value: opportunity?.reportingSmu },
        { label: 'Close Date', value: opportunity?.closeDate },
        { label: 'Stage', value: opportunity?.stageName },
    ].filter(item => !!item.value)

    return (
        <BaseModal
            bodyClassName={styles.body}
            buttons={(
                <Button noCaps onClick={props.onClose} secondary>Close</Button>
            )}
            onClose={props.onClose}
            open={props.open}
            size='md'
            title={opportunity?.name || props.opportunityName}
        >
            {state.status === 'loading' && (
                <div className={styles.state}><LoadingSpinner message='Loading opportunity details…' /></div>
            )}

            {state.status === 'error' && (
                <div className={styles.error} role='alert'>{state.message}</div>
            )}

            {opportunity && (
                <>
                    <h3 className={styles.sectionTitle}>Description</h3>
                    <p className={styles.description}>
                        {opportunity.description || 'This opportunity does not have a description yet.'}
                    </p>

                    {details.length > 0 && (
                        <dl className={styles.details}>
                            {details.map(item => (
                                <div className={styles.detail} key={item.label}>
                                    <dt>{item.label}</dt>
                                    <dd>{item.value}</dd>
                                </div>
                            ))}
                        </dl>
                    )}

                    {billingAccount && (
                        <dl className={styles.billingDetails}>
                            <div className={styles.detail}>
                                <dt>Current billing account</dt>
                                <dd>
                                    {billingAccount.name || 'Name unavailable'}
                                    <span className={styles.accountId}>
                                        ID:
                                        {' '}
                                        {billingAccount.id}
                                    </span>
                                </dd>
                            </div>
                            {projectUrl && (
                                <div className={styles.detail}>
                                    <dt>Work project</dt>
                                    <dd>
                                        <a
                                            className={styles.projectLink}
                                            href={`${projectUrl}/challenges`}
                                            rel='noopener noreferrer'
                                            target='_blank'
                                        >
                                            View project
                                            {' '}
                                            {opportunity.projectId}
                                            {' '}
                                            in Work
                                        </a>
                                    </dd>
                                </div>
                            )}
                            <div className={styles.detail}>
                                <dt>Past billing accounts</dt>
                                <dd>
                                    {pastBillingAccounts.length > 0 ? (
                                        <ul className={styles.accountList}>
                                            {pastBillingAccounts.map(account => (
                                                <li key={account.id}>
                                                    {account.name || 'Name unavailable'}
                                                    <span className={styles.accountId}>
                                                        ID:
                                                        {' '}
                                                        {account.id}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : 'No past billing accounts found.'}
                                </dd>
                            </div>
                        </dl>
                    )}

                    <a
                        className={styles.link}
                        href={opportunity.url}
                        rel='noopener noreferrer'
                        target='_blank'
                    >
                        View in Salesforce
                    </a>
                </>
            )}
        </BaseModal>
    )
}

export default OpportunityModal
