import { FC, useMemo } from 'react'

import { BaseModal, Button } from '~/libs/ui'

import type { Engagement, EngagementAssignment } from '../../lib/models'
import {
    formatCurrencyAmount,
    formatStandardHoursPerDay,
} from '../../lib/utils/currency.utils'
import { formatDate } from '../../lib/utils/date.utils'

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

const formatDurationMonths = (value?: number): string => {
    if (!value) {
        return FALLBACK_LABEL
    }

    return `${value} month${value === 1 ? '' : 's'}`
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

    const paymentCycleLabel = useMemo(
        () => assignment.paymentCycle ?? FALLBACK_LABEL,
        [assignment.paymentCycle],
    )
    const startDateLabel = useMemo(
        () => formatAssignmentDate(assignment.startDate),
        [assignment.startDate],
    )
    const durationMonthsLabel = useMemo(
        () => formatDurationMonths(assignment.durationMonths),
        [assignment.durationMonths],
    )
    const ratePerHourLabel = useMemo(
        () => formatCurrencyAmount(assignment.ratePerHour, FALLBACK_LABEL),
        [assignment.ratePerHour],
    )
    const standardHoursPerDayLabel = useMemo(
        () => formatStandardHoursPerDay(assignment.standardHoursPerDay, FALLBACK_LABEL),
        [assignment.standardHoursPerDay],
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
                            <span className={styles.metaLabel}>Billing start date</span>
                            <span className={styles.metaValue}>{startDateLabel}</span>
                        </div>
                        <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>Duration (in months)</span>
                            <span className={styles.metaValue}>{durationMonthsLabel}</span>
                        </div>
                        <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>Rate per hour</span>
                            <span className={styles.metaValue}>{ratePerHourLabel}</span>
                        </div>
                        <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>Standard hours per day</span>
                            <span className={styles.metaValue}>{standardHoursPerDayLabel}</span>
                        </div>
                        <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>Payment Cycle</span>
                            <span className={styles.metaValue}>{paymentCycleLabel}</span>
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
