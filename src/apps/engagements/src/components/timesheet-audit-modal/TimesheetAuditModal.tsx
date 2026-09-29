import { FC, ReactNode, useEffect, useState } from 'react'

import { EnvironmentConfig } from '~/config'
import { BaseModal, Button, LoadingSpinner } from '~/libs/ui'

import type { TimesheetAuditRecord } from '../../lib/models'
import { getTimesheetEntryAudit } from '../../lib/services'

import styles from './TimesheetAuditModal.module.scss'

interface TimesheetAuditModalProps {
    open: boolean
    engagementId: string
    assignmentId: string
    entryId?: string
    /** Date of the entry whose history is shown, for the dialog title. */
    entryLabel?: string
    onClose: () => void
}

const ACTION_LABELS: Record<string, string> = {
    ADMIN_OVERRIDE: 'Administrator override',
    APPROVED: 'Approved',
    CREATED: 'Created',
    PAYMENT_LINKED: 'Linked to a payment',
    REOPENED: 'Reopened',
    SUBMITTED: 'Submitted',
    UNSUBMITTED: 'Returned to draft',
    UPDATED: 'Updated',
}

const formatAuditDateTime = (value: unknown): string => {
    if (value === null || value === undefined || value === '') {
        return '—'
    }

    const parsed = new Date(String(value))
    return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString()
}

const formatAuditValue = (key: string, value: unknown): ReactNode => {
    if (value === null || value === undefined || value === '') {
        return '—'
    }

    if ((key === 'removedAt' || key === 'paidAt') && typeof value === 'string') {
        return formatAuditDateTime(value)
    }

    if (key === 'managerHandle' && typeof value === 'string') {
        return (
            <a
                href={`${EnvironmentConfig.URLS.USER_PROFILE}/${encodeURIComponent(value)}`}
                rel='noreferrer'
                target='_blank'
            >
                {value}
            </a>
        )
    }

    if (key === 'managerUserId') {
        return String(value)
    }

    return String(value)
}

const formatAuditEntries = (values: unknown): Array<{ key: string, value: ReactNode }> => {
    if (!values || typeof values !== 'object') {
        return [{ key: 'values', value: '—' }]
    }

    const entries = Object.entries(values as Record<string, unknown>)
        .filter(([key]) => key !== 'managerName')

    const managerHandle = entries.find(([key]) => key === 'managerHandle')?.[1]
    const managerUserId = entries.find(([key]) => key === 'managerUserId')?.[1]

    const formattedEntries = entries
        .filter(([key]) => key !== 'managerHandle' && key !== 'managerUserId')
        .map(([key, value]) => ({
            key: {
                approvedByHandle: 'approved by',
                hoursWorked: 'hours worked',
                managerHandle: 'manager',
                managerName: 'manager name',
                managerUserId: 'user ID',
                paidAt: 'paid at',
                paidPaymentReference: 'payment ID',
                removedAt: 'removed at',
                workDate: 'work date',
            }[key]
                ?? key.replace(/([A-Z])/g, ' $1')
                    .trim()
                    .toLowerCase(),
            value: formatAuditValue(key, value),
        }))

    if (managerHandle && typeof managerHandle === 'string') {
        return [{
            key: 'manager',
            value: (
                <>
                    <a
                        href={`${EnvironmentConfig.URLS.USER_PROFILE}/${encodeURIComponent(managerHandle)}`}
                        rel='noreferrer'
                        target='_blank'
                    >
                        {managerHandle}
                    </a>
                    {managerUserId !== undefined && managerUserId !== null && ` (${String(managerUserId)})`}
                </>
            ),
        }, ...formattedEntries]
    }

    return formattedEntries
}

const formatTimestamp = (value: string): string => {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString()
}

/**
 * Audit history for one entry.
 *
 * Read-only and administrator-only: the API refuses anyone else, so this is only mounted from the
 * administrator view.
 */
const TimesheetAuditModal: FC<TimesheetAuditModalProps> = (props: TimesheetAuditModalProps) => {
    const [records, setRecords] = useState<TimesheetAuditRecord[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | undefined>()

    useEffect(() => {
        let mounted = true

        if (!props.open || !props.entryId) {
            return () => undefined
        }

        setIsLoading(true)
        setError(undefined)

        getTimesheetEntryAudit(props.engagementId, props.assignmentId, props.entryId)
            .then(loaded => {
                if (mounted) {
                    setRecords(loaded)
                }
            })
            .catch(() => {
                if (mounted) {
                    setError('Failed to load the audit history.')
                }
            })
            .finally(() => {
                if (mounted) {
                    setIsLoading(false)
                }
            })

        return () => {
            mounted = false
        }
    }, [props.assignmentId, props.engagementId, props.entryId, props.open])

    return (
        <BaseModal
            buttons={<Button label='Close' onClick={props.onClose} secondary />}
            onClose={props.onClose}
            open={props.open}
            size='lg'
            title={props.entryLabel ? `Audit history - ${props.entryLabel}` : 'Audit history'}
        >
            {isLoading && <LoadingSpinner />}

            {!isLoading && error && (
                <p className={styles.error} role='alert'>{error}</p>
            )}

            {!isLoading && !error && records.length === 0 && (
                <p className={styles.empty}>No recorded changes for this entry.</p>
            )}

            {!isLoading && !error && records.length > 0 && (
                <ol className={styles.records}>
                    {records.map(record => (
                        <li className={styles.record} key={record.id}>
                            <div className={styles.recordHeader}>
                                <strong>{ACTION_LABELS[record.action] ?? record.action}</strong>
                                <span className={styles.actor}>
                                    {record.actorHandle ?? record.actorUserId}
                                    {` (${record.actorRole})`}
                                </span>
                                <span className={styles.timestamp}>
                                    {formatTimestamp(record.createdAt)}
                                </span>
                            </div>
                            <dl className={styles.values}>
                                <div>
                                    {/* <dt>After</dt> */}
                                    <dd>
                                        <dl className={styles.subValues}>
                                            {formatAuditEntries(record.updatedValues)
                                                .map(entry => (
                                                    <div key={`${record.id}-after-${entry.key}`}>
                                                        <dt>{entry.key}</dt>
                                                        <dd>{entry.value}</dd>
                                                    </div>
                                                ))}
                                        </dl>
                                    </dd>
                                </div>
                                {record.comment && (
                                    <div>
                                        <dt>Comment or reason</dt>
                                        <dd>{record.comment}</dd>
                                    </div>
                                )}
                            </dl>
                        </li>
                    ))}
                </ol>
            )}
        </BaseModal>
    )
}

export default TimesheetAuditModal
