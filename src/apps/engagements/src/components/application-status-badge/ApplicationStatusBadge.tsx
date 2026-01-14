import { FC } from 'react'
import classNames from 'classnames'

import { ApplicationStatus } from '../../lib/models'

import styles from './ApplicationStatusBadge.module.scss'

interface ApplicationStatusBadgeProps {
    status: ApplicationStatus
    size?: 'sm' | 'md' | 'lg'
}

const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
    [ApplicationStatus.SUBMITTED]: 'Submitted',
    [ApplicationStatus.UNDER_REVIEW]: 'Under Review',
    [ApplicationStatus.ACCEPTED]: 'Accepted',
    [ApplicationStatus.REJECTED]: 'Rejected',
}

const ApplicationStatusBadge: FC<ApplicationStatusBadgeProps> = (
    props: ApplicationStatusBadgeProps,
) => {
    const label = APPLICATION_STATUS_LABELS[props.status] ?? props.status
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

export default ApplicationStatusBadge
