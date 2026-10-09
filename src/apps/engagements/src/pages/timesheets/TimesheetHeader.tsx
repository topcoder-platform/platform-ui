import { FC } from 'react'

import { Button } from '~/libs/ui'

import type { EngagementManager, TimesheetAssignment } from '../../lib/models'

import styles from './TimesheetsPage.module.scss'

interface TimesheetHeaderProps {
    engagementTitle: string
    assignment: TimesheetAssignment
    managers: EngagementManager[]
    onEditManagers?: () => void
    onViewManagersAudit?: () => void
    /** Shows total and remaining hours - for the people who review and pay, not the member. */
    showAssignmentHours?: boolean
}

const withHandle = (name: string | null | undefined, handle: string): string => (
    name ? `${name} (${handle})` : handle
)

/** Blank without a total, as there is nothing to count down from; "Unavailable" if payments failed. */
const formatHoursLeft = (assignment: TimesheetAssignment): string => {
    if (assignment.totalHours === null || assignment.totalHours === undefined) {
        return ''
    }

    return assignment.hoursLeft === null || assignment.hoursLeft === undefined
        ? 'Unavailable'
        : String(assignment.hoursLeft)
}

/**
 * Read-only engagement information, shown above the grid in all three role views.
 */
const TimesheetHeader: FC<TimesheetHeaderProps> = (props: TimesheetHeaderProps) => (
    <section className={styles.header}>
        <div className={styles.headerTitleRow}>
            <h2 className={styles.title}>{props.engagementTitle}</h2>
            <div className={styles.headerActions}>
                {props.onViewManagersAudit && (
                    <Button
                        label='View managers audit'
                        onClick={props.onViewManagersAudit}
                        secondary
                        size='sm'
                    />
                )}
                {props.onEditManagers && (
                    <Button
                        label='Edit managers'
                        onClick={props.onEditManagers}
                        secondary
                        size='sm'
                    />
                )}
            </div>
        </div>
        <dl className={styles.headerFacts}>
            <div className={styles.fact}>
                <dt>Standard Hours per Day</dt>
                <dd>{props.assignment.standardHoursPerDay ?? 'Not set'}</dd>
            </div>
            {props.showAssignmentHours && (
                <>
                    <div className={styles.fact}>
                        <dt>Total Hours</dt>
                        <dd>{props.assignment.totalHours ?? 'Not set'}</dd>
                    </div>
                    <div className={styles.fact}>
                        <dt>Hours Left</dt>
                        <dd>{formatHoursLeft(props.assignment)}</dd>
                    </div>
                </>
            )}
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
