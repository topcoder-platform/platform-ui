/* The modal body renders only the opportunity fields the report already exposes. */
import { FC, useEffect, useState } from 'react'

import { BaseModal, Button, LoadingSpinner } from '~/libs/ui'

import {
    fetchOpportunity,
    opportunityErrorMessage,
    SalesOpportunity,
} from './opportunity.service'
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
