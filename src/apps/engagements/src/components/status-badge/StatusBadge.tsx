import { FC } from 'react'
import classNames from 'classnames'

import { EngagementStatus } from '../../lib/models'

import styles from './StatusBadge.module.scss'

interface StatusBadgeProps {
    status: EngagementStatus
    size?: 'sm' | 'md' | 'lg'
}

const STATUS_LABELS: Record<EngagementStatus, string> = {
    [EngagementStatus.OPEN]: 'Open',
    [EngagementStatus.PENDING_ASSIGNMENT]: 'Pending Assignment',
    [EngagementStatus.ACTIVE]: 'Active',
    [EngagementStatus.CANCELLED]: 'Cancelled',
    [EngagementStatus.CLOSED]: 'Closed',
}

const StatusBadge: FC<StatusBadgeProps> = (props: StatusBadgeProps) => {
    const label = STATUS_LABELS[props.status] ?? props.status
    const size = props.size ?? 'md'

    return (
        <span
            className={classNames(
                styles.badge,
                styles[`status-${props.status}`],
                styles[`size-${size}`],
            )}
        >
            {label}
        </span>
    )
}

export default StatusBadge
