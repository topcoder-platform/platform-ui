import { FC } from 'react'
import classNames from 'classnames'

import { EngagementStatus } from '../../lib/models'

import styles from './StatusBadge.module.scss'

interface StatusBadgeProps {
    status: EngagementStatus | string
    size?: 'sm' | 'md' | 'lg'
    label?: string
}

const STATUS_LABELS: Record<EngagementStatus, string> = {
    [EngagementStatus.OPEN]: 'Open',
    [EngagementStatus.PENDING_ASSIGNMENT]: 'Pending Assignment',
    [EngagementStatus.ACTIVE]: 'Active',
    [EngagementStatus.CANCELLED]: 'Cancelled',
    [EngagementStatus.CLOSED]: 'Closed',
}

const formatStatusLabel = (value?: string): string => {
    const normalized = value === undefined || value === null
        ? undefined
        : value.toString()
            .trim()
    if (!normalized) {
        return 'TBD'
    }

    return normalized
        .replace(/[_-]+/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, character => character.toUpperCase())
}

const StatusBadge: FC<StatusBadgeProps> = (props: StatusBadgeProps) => {
    const statusValue = props.status === undefined || props.status === null
        ? undefined
        : props.status.toString()
            .trim()
    const statusKey = statusValue
        ? statusValue
            .toLowerCase()
            .replace(/[\s-]+/g, '_')
        : 'unknown'
    const label = props.label
        ?? STATUS_LABELS[statusKey as EngagementStatus]
        ?? formatStatusLabel(statusValue)
    const size = props.size ?? 'md'
    const statusClass = styles[`status-${statusKey}`] ?? styles['status-generic']

    return (
        <span
            className={classNames(
                styles.badge,
                statusClass,
                styles[`size-${size}`],
            )}
        >
            {label}
        </span>
    )
}

export default StatusBadge
