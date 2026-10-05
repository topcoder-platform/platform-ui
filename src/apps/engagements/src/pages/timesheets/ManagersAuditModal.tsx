import { FC, ReactNode, useEffect, useState } from 'react'

import { EnvironmentConfig } from '~/config'
import { BaseModal, Button, LoadingSpinner } from '~/libs/ui'

import type { TimesheetAuditRecord } from '../../lib/models'
import { getEngagementManagersAudit } from '../../lib/services'

import styles from './TimesheetsPage.module.scss'

interface ManagersAuditModalProps {
    open: boolean
    engagementId?: string
    onClose: () => void
}

const MANAGER_AUDIT_ACTION_LABELS: Record<string, string> = {
    MANAGER_ASSIGNED: 'Manager assigned',
    MANAGER_REMOVED: 'Manager removed',
}

const formatAuditDateTime = (value: unknown): string => {
    if (value === null || value === undefined || value === '') {
        return '—'
    }

    const parsed = new Date(String(value))
    return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString()
}

const formatAuditKey = (key: string): string => ({
    approvedByHandle: 'approved by',
    hoursWorked: 'hours worked',
    managerHandle: 'manager',
    managerName: 'manager name',
    paidAt: 'paid at',
    paidPaymentReference: 'payment ID',
    removedAt: 'removed at',
    workDate: 'work date',
}[key]
    ?? key.replace(/([A-Z])/g, ' $1')
        .trim()
        .toLowerCase())

const formatAuditLabelValue = (key: string, value: unknown): string | ReactNode => {
    if (value === null || value === undefined || value === '') {
        return '—'
    }

    if ((key === 'removedAt' || key === 'paidAt') && typeof value === 'string') {
        return formatAuditDateTime(value)
    }

    if (key === 'managerHandle' && typeof value === 'string') {
        return (
            <>
                <a
                    href={`${EnvironmentConfig.URLS.USER_PROFILE}/${encodeURIComponent(value)}`}
                    rel='noreferrer'
                    target='_blank'
                >
                    {value}
                </a>
            </>
        )
    }

    return String(value)
}

const formatAuditEntries = (values: unknown): Array<{ key: string, value: string | ReactNode }> => {
    if (!values || typeof values !== 'object') {
        return [{ key: 'values', value: '—' }]
    }

    const entries = Object.entries(values as Record<string, unknown>)
        .filter(([key]) => key !== 'managerName')

    const managerHandle = entries.find(([key]) => key === 'managerHandle')?.[1]
    const managerUserId = entries.find(([key]) => key === 'managerUserId')?.[1]

    const normalizedEntries = entries
        .filter(([key]) => key !== 'managerHandle' && key !== 'managerUserId')
        .map(([key, value]) => ({
            key: formatAuditKey(key),
            value: formatAuditLabelValue(key, value),
        }))

    if (typeof managerHandle === 'string') {
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
        }, ...normalizedEntries]
    }

    return normalizedEntries
}

const formatAuditTimestamp = (value: string): string => {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString()
}

const ManagersAuditModal: FC<ManagersAuditModalProps> = (props: ManagersAuditModalProps) => {
    const [managerAudit, setManagerAudit] = useState<TimesheetAuditRecord[]>([])
    const [managerAuditError, setManagerAuditError] = useState<string | undefined>()
    const [isManagersAuditLoading, setIsManagersAuditLoading] = useState<boolean>(false)

    useEffect(() => {
        if (!props.open || !props.engagementId) {
            return undefined
        }

        let mounted = true
        setIsManagersAuditLoading(true)
        setManagerAuditError(undefined)

        getEngagementManagersAudit(props.engagementId)
            .then(loaded => {
                if (mounted) {
                    setManagerAudit(loaded)
                }
            })
            .catch(() => {
                if (mounted) {
                    setManagerAuditError('Failed to load the manager audit history.')
                }
            })
            .finally(() => {
                if (mounted) {
                    setIsManagersAuditLoading(false)
                }
            })

        return () => {
            mounted = false
        }
    }, [props.engagementId, props.open])

    return (
        <BaseModal
            buttons={<Button label='Close' onClick={props.onClose} secondary />}
            onClose={props.onClose}
            open={props.open}
            size='lg'
            title='Manager assignment audit'
        >
            {isManagersAuditLoading && <LoadingSpinner />}

            {!isManagersAuditLoading && managerAuditError && (
                <p className={styles.error} role='alert'>{managerAuditError}</p>
            )}

            {!isManagersAuditLoading && !managerAuditError && managerAudit.length === 0 && (
                <p className={styles.pending}>No manager assignment changes recorded.</p>
            )}

            {!isManagersAuditLoading && !managerAuditError && managerAudit.length > 0 && (
                <ol className={styles.auditList}>
                    {managerAudit.map(record => (
                        <li className={styles.auditRecord} key={record.id}>
                            <div className={styles.auditHeader}>
                                <strong>
                                    {MANAGER_AUDIT_ACTION_LABELS[record.action] ?? record.action}
                                </strong>
                                <span className={styles.auditMeta}>
                                    {record.actorHandle ?? record.actorUserId}
                                    {` (${record.actorRole})`}
                                </span>
                                <span className={styles.auditMeta}>
                                    {formatAuditTimestamp(record.createdAt)}
                                </span>
                            </div>
                            <dl className={styles.auditSummary}>
                                <div>
                                    <dt>After</dt>
                                    <dd>
                                        <dl className={styles.nestedAuditList}>
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
                                        <dt>Comment</dt>
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

export default ManagersAuditModal
