import { FC, useMemo } from 'react'

import { BaseModal, Button } from '~/libs/ui'

import type { Engagement, EngagementAssignment } from '../../lib/models'
import { formatDate } from '../../lib/utils'

import styles from './AssignmentOfferModal.module.scss'

interface AssignmentOfferModalProps {
    open: boolean
    onClose: () => void
    onConfirm: () => void
    engagement: Engagement
    assignment: EngagementAssignment
    mode: 'accept' | 'reject'
    loading?: boolean
}

const FALLBACK_LABEL = 'TBD'
const EMPTY_REMARKS_LABEL = 'None'

const formatAssignmentDate = (value?: string): string => {
    if (!value) {
        return FALLBACK_LABEL
    }

    const formatted = formatDate(value)
    return formatted === 'Date TBD' ? FALLBACK_LABEL : formatted
}

const formatAgreementRate = (value?: string): string => {
    if (value === null || value === undefined) {
        return FALLBACK_LABEL
    }

    const normalized = value.toString()
        .trim()
    return normalized || FALLBACK_LABEL
}

const formatRemarks = (value?: string): string => {
    const normalized = value?.trim()
    return normalized || EMPTY_REMARKS_LABEL
}

const AssignmentOfferModal: FC<AssignmentOfferModalProps> = (
    props: AssignmentOfferModalProps,
) => {
    const assignment = props.assignment
    const engagement = props.engagement
    const loading = props.loading
    const mode = props.mode
    const onClose = props.onClose
    const onConfirm = props.onConfirm
    const open = props.open
    const isReject = mode === 'reject'
    const title = isReject ? 'Reject Offer' : 'Accept Offer'
    const actionLabel = isReject ? 'Reject Offer' : 'Accept Offer'
    const helperText = isReject
        ? 'Review the details below before rejecting this offer.'
        : 'Review the details below before accepting this offer.'

    const agreementRateLabel = useMemo(
        () => formatAgreementRate(assignment.agreementRate),
        [assignment.agreementRate],
    )
    const startDateLabel = useMemo(
        () => formatAssignmentDate(assignment.startDate),
        [assignment.startDate],
    )
    const endDateLabel = useMemo(
        () => formatAssignmentDate(assignment.endDate),
        [assignment.endDate],
    )
    const otherRemarksLabel = useMemo(
        () => formatRemarks(assignment.otherRemarks),
        [assignment.otherRemarks],
    )

    return (
        <BaseModal
            open={open}
            onClose={onClose}
            title={title}
            size='md'
            bodyClassName={styles.modalBody}
            buttons={(
                <div className={styles.modalActions}>
                    <Button
                        label='Cancel'
                        onClick={onClose}
                        secondary
                        disabled={loading}
                    />
                    <Button
                        label={actionLabel}
                        onClick={onConfirm}
                        primary
                        variant={isReject ? 'danger' : undefined}
                        loading={loading}
                        disabled={loading}
                    />
                </div>
            )}
        >
            <div className={styles.content}>
                <div className={styles.header}>
                    <h3 className={styles.title}>{engagement.title || 'Engagement'}</h3>
                    <p className={styles.subTitle}>{helperText}</p>
                </div>
                <div className={styles.section}>
                    <h4>Assignment details</h4>
                    <div className={styles.metaGrid}>
                        <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>Agreement rate</span>
                            <span className={styles.metaValue}>{agreementRateLabel}</span>
                        </div>
                        <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>Tentative start date</span>
                            <span className={styles.metaValue}>{startDateLabel}</span>
                        </div>
                        <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>Tentative end date</span>
                            <span className={styles.metaValue}>{endDateLabel}</span>
                        </div>
                        <div className={`${styles.metaItem} ${styles.metaItemWide}`}>
                            <span className={styles.metaLabel}>Other remarks</span>
                            <span className={styles.metaValue}>{otherRemarksLabel}</span>
                        </div>
                    </div>
                </div>
            </div>
        </BaseModal>
    )
}

export default AssignmentOfferModal
