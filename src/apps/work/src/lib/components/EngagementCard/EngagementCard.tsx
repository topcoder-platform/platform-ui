import { FC } from 'react'
import { Link } from 'react-router-dom'

import { Engagement } from '../../models'
import {
    formatAnticipatedStart,
    formatDuration,
    formatLocation,
    getApplicationsCount,
    getAssignedMembersCount,
} from '../../utils'

import styles from './EngagementCard.module.scss'

interface EngagementCardProps {
    canManage?: boolean
    engagement: Engagement
    projectId: number | string
}

export const EngagementCard: FC<EngagementCardProps> = (props: EngagementCardProps) => {
    const engagement = props.engagement
    const canManage = props.canManage === true
    const projectId = props.projectId

    const applicationsCount = getApplicationsCount(engagement)
    const assignedMembersCount = getAssignedMembersCount(engagement)

    return (
        <article className={styles.card}>
            <header className={styles.header}>
                <h3 className={styles.title}>{engagement.title || 'Untitled engagement'}</h3>
                <span className={styles.status}>{engagement.status}</span>
            </header>

            <div className={styles.metaGrid}>
                <div>
                    <span className={styles.label}>Duration</span>
                    <span className={styles.value}>{formatDuration(engagement)}</span>
                </div>
                <div>
                    <span className={styles.label}>Location</span>
                    <span className={styles.value}>{formatLocation(engagement)}</span>
                </div>
                <div>
                    <span className={styles.label}>Anticipated Start</span>
                    <span className={styles.value}>{formatAnticipatedStart(engagement.anticipatedStart)}</span>
                </div>
                <div>
                    <span className={styles.label}>Applications</span>
                    <span className={styles.value}>{applicationsCount}</span>
                </div>
                <div>
                    <span className={styles.label}>Members Assigned</span>
                    <span className={styles.value}>{assignedMembersCount}</span>
                </div>
            </div>

            <footer className={styles.actions}>
                <Link
                    className={styles.actionLink}
                    to={`/projects/${projectId}/engagements/${engagement.id}/applications`}
                >
                    Applications
                </Link>
                <Link
                    className={styles.actionLink}
                    to={`/projects/${projectId}/engagements/${engagement.id}/assignments`}
                >
                    Assignments
                </Link>
                {canManage
                    ? (
                        <Link
                            className={styles.actionLink}
                            to={`/projects/${projectId}/engagements/${engagement.id}`}
                        >
                            Edit
                        </Link>
                    )
                    : undefined}
            </footer>
        </article>
    )
}

export default EngagementCard
