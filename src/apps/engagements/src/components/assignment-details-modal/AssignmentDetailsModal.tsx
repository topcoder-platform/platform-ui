import { FC } from 'react'

import { BaseModal, Button } from '~/libs/ui'

import styles from './AssignmentDetailsModal.module.scss'

export interface AssignmentDetail {
    label: string
    value: string
}

interface AssignmentDetailsModalProps {
    details: AssignmentDetail[]
    onClose: () => void
    open: boolean
    title: string
}

/**
 * Read-only view of the terms of a member's assignment, kept off the assignment card so the card
 * stays short.
 */
const AssignmentDetailsModal: FC<AssignmentDetailsModalProps> = (props: AssignmentDetailsModalProps) => (
    <BaseModal
        open={props.open}
        onClose={props.onClose}
        title='Assignment Details'
        size='md'
        buttons={(
            <div className={styles.modalActions}>
                <Button label='Close' onClick={props.onClose} secondary />
            </div>
        )}
    >
        <div className={styles.content}>
            <h3 className={styles.title}>{props.title}</h3>
            <dl className={styles.metaGrid}>
                {props.details.map(detail => (
                    <div key={detail.label} className={styles.metaItem}>
                        <dt className={styles.metaLabel}>{detail.label}</dt>
                        <dd className={styles.metaValue}>{detail.value}</dd>
                    </div>
                ))}
            </dl>
        </div>
    </BaseModal>
)

export default AssignmentDetailsModal
