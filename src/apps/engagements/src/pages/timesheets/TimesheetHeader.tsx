import { FC } from 'react'

import type { EngagementManager, TimesheetAssignment } from '../../lib/models'

import styles from './TimesheetsPage.module.scss'

interface TimesheetHeaderProps {
    engagementTitle: string
    assignment: TimesheetAssignment
    managers: EngagementManager[]
}

const withHandle = (name: string | null | undefined, handle: string): string => (
    name ? `${name} (${handle})` : handle
)

/**
 * Read-only engagement information, shown above the grid in all three role views.
 */
const TimesheetHeader: FC<TimesheetHeaderProps> = (props: TimesheetHeaderProps) => (
    <section className={styles.header}>
        <h2 className={styles.title}>{props.engagementTitle}</h2>
        <dl className={styles.headerFacts}>
            <div className={styles.fact}>
                <dt>Standard Hours per Day</dt>
                <dd>{props.assignment.standardHoursPerDay ?? 'Not set'}</dd>
            </div>
            <div className={styles.fact}>
                <dt>Member</dt>
                <dd>
                    {withHandle(props.assignment.memberName, props.assignment.memberHandle)}
                </dd>
            </div>
            <div className={styles.fact}>
                <dt>{props.managers.length === 1 ? 'Manager' : 'Managers'}</dt>
                <dd>
                    {props.managers.length === 0
                        ? 'No managers assigned'
                        : props.managers
                            .map(manager => withHandle(manager.name, manager.handle))
                            .join(', ')}
                </dd>
            </div>
        </dl>
    </section>
)

export default TimesheetHeader
