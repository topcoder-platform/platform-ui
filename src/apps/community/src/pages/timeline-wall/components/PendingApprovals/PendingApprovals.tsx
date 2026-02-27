import { FC } from 'react'
import classNames from 'classnames'

import { type TimelineEvent } from '../../../../lib/models'
import { type RejectTimelineEventBody } from '../../../../lib/services'
import { ApprovalItem } from '../ApprovalItem'

import styles from './PendingApprovals.module.scss'

interface PendingApprovalsProps {
    className?: string
    events: TimelineEvent[]
    onApproveEvent: (id: string) => Promise<void> | void
    onDeleteEvent: (id: string) => Promise<void> | void
    onRejectEvent: (
        id: string,
        body: RejectTimelineEventBody,
    ) => Promise<void> | void
    userAvatars: Record<string, string>
}

/**
 * Admin tab content that lists pending timeline submissions.
 *
 * @param props Pending events and moderation callbacks.
 * @returns Pending approvals list.
 */
const PendingApprovals: FC<PendingApprovalsProps> = (props: PendingApprovalsProps) => (
    <div className={classNames(styles.container, props.className)}>
        <div className={styles.content}>
            {props.events.map(item => (
                <ApprovalItem
                    event={item}
                    key={item.id}
                    onApproveEvent={props.onApproveEvent}
                    onDeleteEvent={props.onDeleteEvent}
                    onRejectEvent={props.onRejectEvent}
                    userAvatars={props.userAvatars}
                />
            ))}
        </div>

        {!props.events.length && (
            <span className={styles.emptyState}>No pending events.</span>
        )}
    </div>
)

PendingApprovals.defaultProps = {
    className: undefined,
}

export default PendingApprovals
