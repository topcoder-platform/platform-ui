import { FC } from 'react'

import { IconOutline } from '~/libs/ui'

import { ENGAGEMENTS_APP_URL } from '../../constants'

import styles from './TimesheetEngagementLink.module.scss'

/**
 * Timesheet page for an engagement and assignee, in the Engagements Portal. The portal checks the
 * caller's access itself, so linking here grants nothing.
 */
export function buildEngagementTimesheetUrl(
    engagementId: number | string,
    assignmentId: number | string,
): string {
    return `${ENGAGEMENTS_APP_URL}/${encodeURIComponent(String(engagementId))}`
        + `/timesheets/${encodeURIComponent(String(assignmentId))}`
}

interface TimesheetEngagementLinkProps {
    assignmentId?: number | string
    engagementId?: number | string
    engagementTitle?: string
}

/**
 * The engagement name on the timesheet tabs, linked to the assignee's timesheet in the Engagements
 * Portal (opened in a new tab). Plain text when the row cannot identify the timesheet.
 */
export const TimesheetEngagementLink: FC<TimesheetEngagementLinkProps> = (
    props: TimesheetEngagementLinkProps,
) => {
    const title = String(props.engagementTitle || '')
        .trim() || '-'

    if (!props.engagementId || !props.assignmentId) {
        return <>{title}</>
    }

    return (
        <a
            className={styles.link}
            href={buildEngagementTimesheetUrl(props.engagementId, props.assignmentId)}
            rel='noreferrer noopener'
            target='_blank'
        >
            {title}
            <IconOutline.ExternalLinkIcon
                aria-hidden='true'
                className={styles.externalIcon}
            />
        </a>
    )
}

export default TimesheetEngagementLink
