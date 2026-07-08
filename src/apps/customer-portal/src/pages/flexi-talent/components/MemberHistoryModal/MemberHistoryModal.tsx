/* eslint-disable complexity */
/* eslint-disable react/jsx-no-bind */
import { FC, useEffect, useMemo, useRef, useState } from 'react'
import classNames from 'classnames'

import { BaseModal, IconOutline } from '~/libs/ui'

import {
    FlexiMemberHistoryItem,
    FlexiMemberListItem,
    FlexiMemberWorkLinks,
    getFlexiMemberHistory,
} from '../../../../lib'
import styles from '../../FlexiTalentPage/FlexiTalentPage.module.scss'

type HistoryState = 'loading' | 'empty' | 'error' | 'ready'

export interface MemberHistoryModalProps {
    member?: FlexiMemberListItem
    onClose: () => void
    open: boolean
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
})

/**
 * Formats API dates for the member history modal.
 *
 * @param value ISO date string returned by engagements-api-v6.
 * @returns A localized date label, or a fallback when no valid date is present.
 */
function formatDate(value?: string | null): string {
    if (!value) {
        return 'Not set'
    }

    const parsedDate = new Date(value)
    if (Number.isNaN(parsedDate.getTime())) {
        return 'Not set'
    }

    return dateFormatter.format(parsedDate)
}

/**
 * Returns the current-assignment time-left value from the backend DTO field.
 *
 * @param row History row returned by the member history endpoint.
 * @returns The days-remaining number, or undefined when no timing field is present.
 */
function getRemainingDays(row: FlexiMemberHistoryItem): number | undefined {
    const days = row.timeLeftDays

    return days === null || days === undefined ? undefined : days
}

/**
 * Formats current-assignment timing from backend timing fields.
 *
 * @param row History row returned by the member history endpoint.
 * @returns Human-readable current-assignment timing text.
 */
function formatCurrentTiming(row: FlexiMemberHistoryItem): string {
    const days = getRemainingDays(row)
    if (days === undefined) {
        return row.resolvedEndDate
            ? `Ends ${formatDate(row.resolvedEndDate)}`
            : 'No end date'
    }

    if (days < 0 || row.isOverdue) {
        const overdueDays = Math.abs(days)
        return `${overdueDays} ${overdueDays === 1 ? 'day' : 'days'} overdue`
    }

    if (days === 0) {
        return 'Due today'
    }

    return `${days} ${days === 1 ? 'day' : 'days'} left`
}

/**
 * Formats assignment timing for current and completed history rows.
 *
 * @param row History row returned by the member history endpoint.
 * @returns Human-readable timing text derived from backend fields.
 */
function formatHistoryTiming(row: FlexiMemberHistoryItem): string {
    if (row.isCurrent) {
        return formatCurrentTiming(row)
    }

    if (row.completedAt) {
        return `Completed ${formatDate(row.completedAt)}`
    }

    if (row.resolvedEndDate) {
        return `Resolved ${formatDate(row.resolvedEndDate)}`
    }

    return 'Completion date not set'
}

/**
 * Formats backend duration fields for history cards.
 *
 * @param row History row returned by the member history endpoint.
 * @returns Duration label, computed month/week label, or fallback text.
 */
function formatDuration(row: FlexiMemberHistoryItem): string {
    if (row.durationLabel) {
        return row.durationLabel
    }

    const durationParts = [
        row.durationMonths ? `${row.durationMonths} mo` : '',
        row.durationWeeks ? `${row.durationWeeks} wk` : '',
    ].filter(Boolean)

    if (durationParts.length > 0) {
        return durationParts.join(' ')
    }

    return 'Not set'
}

/**
 * Detects whether a normalized Work-link collection contains any destinations.
 *
 * @param workLinks Normalized Work Manager links from the member service.
 * @returns True when at least one Work destination can be rendered.
 */
function hasWorkLinks(workLinks: FlexiMemberWorkLinks): boolean {
    return Boolean(workLinks.projectUrl || workLinks.engagementUrl || workLinks.assigneeDetailsUrl)
}

/**
 * Detects whether a history row should use overdue timing emphasis.
 *
 * @param row History row returned by the member history endpoint.
 * @returns True when a current assignment is overdue by remaining days or flag.
 */
function isHistoryRowOverdue(row: FlexiMemberHistoryItem): boolean {
    const days = getRemainingDays(row)

    return Boolean(row.isCurrent && ((days !== undefined && days < 0) || row.isOverdue))
}

/**
 * Member assignment history modal for the Flexi-Talent Members view.
 *
 * Fetches full backend-ordered member history on demand when opened, keeps
 * loading/error/data state inside the modal, and renders normalized Work links
 * for each returned assignment row.
 */
export const MemberHistoryModal: FC<MemberHistoryModalProps> = props => {
    const historyGenerationRef = useRef<number>(0)
    const memberId = props.member?.memberId || ''

    const [historyState, setHistoryState] = useState<HistoryState>('empty')
    const [historyData, setHistoryData] = useState<FlexiMemberHistoryItem[]>([])
    const [historyMemberHandle, setHistoryMemberHandle] = useState<string>('')
    const [historyErrorMessage, setHistoryErrorMessage] = useState<string>('')

    useEffect(() => {
        if (!props.open || !memberId) {
            historyGenerationRef.current += 1
            setHistoryData([])
            setHistoryMemberHandle('')
            setHistoryErrorMessage('')
            setHistoryState('empty')
            return undefined
        }

        const generation = historyGenerationRef.current + 1
        historyGenerationRef.current = generation
        setHistoryData([])
        setHistoryMemberHandle('')
        setHistoryErrorMessage('')
        setHistoryState('loading')

        getFlexiMemberHistory(memberId)
            .then(response => {
                if (historyGenerationRef.current !== generation) {
                    return
                }

                const rows = Array.isArray(response.data) ? response.data : []
                setHistoryMemberHandle(response.handle)
                setHistoryData(rows)
                setHistoryState(rows.length > 0 ? 'ready' : 'empty')
            })
            .catch(() => {
                if (historyGenerationRef.current !== generation) {
                    return
                }

                setHistoryErrorMessage('Could not load member history.')
                setHistoryState('error')
            })

        return () => {
            historyGenerationRef.current += 1
        }
    }, [memberId, props.open])

    const title = useMemo(() => (
        <div className={styles.historyModalTitle}>
            <span>Member History</span>
            <strong>{historyMemberHandle || props.member?.handle || 'Selected member'}</strong>
        </div>
    ), [historyMemberHandle, props.member?.handle])

    return (
        <BaseModal
            bodyClassName={styles.historyModalBody}
            onClose={props.onClose}
            open={props.open}
            size='lg'
            title={title}
        >
            <div className={styles.historyModalHeader}>
                <p className={styles.historyModalNotice}>
                    Active assignments are shown first, followed by past assignments in the backend order.
                </p>
            </div>

            {historyState === 'loading' && (
                <div className={styles.modalContainedState}>
                    <div className={classNames(styles.skeletonBlock, styles.skeletonCardSmall)} />
                    <div className={classNames(styles.skeletonBlock, styles.skeletonCardSmall)} />
                </div>
            )}

            {historyState === 'error' && (
                <div className={styles.modalContainedError}>
                    <IconOutline.ExclamationCircleIcon />
                    <p>{historyErrorMessage}</p>
                </div>
            )}

            {historyState === 'empty' && (
                <div className={styles.modalContainedState}>
                    <IconOutline.InboxIcon />
                    <p>No assignment history was returned for this member.</p>
                </div>
            )}

            {historyState === 'ready' && (
                <div className={styles.historyCardList}>
                    {historyData.map((row, index) => (
                        <article
                            className={styles.historyCard}
                            key={
                                [
                                    row.memberHandle,
                                    row.assignmentId || row.engagementId || row.completedAt || index,
                                ].join('-')
                            }
                        >
                            <div className={styles.historyCardHeader}>
                                <div>
                                    <h4>{row.engagementTitle || 'Engagement title unavailable'}</h4>
                                    <p>{row.projectName || 'Project name unavailable'}</p>
                                </div>
                                <span
                                    className={classNames(
                                        styles.statusPill,
                                        row.isCurrent ? styles.statusPillCurrent : styles.statusPillCompleted,
                                    )}
                                >
                                    {row.displayStatusLabel}
                                </span>
                            </div>

                            <dl className={styles.assignmentMeta}>
                                <div>
                                    <dt>Timing</dt>
                                    <dd className={isHistoryRowOverdue(row) ? styles.overdueText : undefined}>
                                        {formatHistoryTiming(row)}
                                    </dd>
                                </div>
                                <div>
                                    <dt>Duration</dt>
                                    <dd>{formatDuration(row)}</dd>
                                </div>
                                <div>
                                    <dt>Start</dt>
                                    <dd>{formatDate(row.startDate)}</dd>
                                </div>
                                <div>
                                    <dt>Resolved End</dt>
                                    <dd>{formatDate(row.resolvedEndDate)}</dd>
                                </div>
                            </dl>

                            <div className={styles.detailSection}>
                                <h4>Skills</h4>
                                {Array.isArray(row.skills) && row.skills.length > 0 ? (
                                    <div className={styles.skillList}>
                                        {row.skills.map(skill => (
                                            <span className={styles.skillPill} key={skill.id}>{skill.name}</span>
                                        ))}
                                    </div>
                                ) : (
                                    <p>No skills listed.</p>
                                )}
                            </div>

                            {hasWorkLinks(row.workLinks) && (
                                <div className={styles.workLinks}>
                                    {row.workLinks.projectUrl && (
                                        <a href={row.workLinks.projectUrl} rel='noreferrer' target='_blank'>
                                            Project
                                            <IconOutline.ExternalLinkIcon />
                                        </a>
                                    )}
                                    {row.workLinks.engagementUrl && (
                                        <a href={row.workLinks.engagementUrl} rel='noreferrer' target='_blank'>
                                            Engagement
                                            <IconOutline.ExternalLinkIcon />
                                        </a>
                                    )}
                                    {row.workLinks.assigneeDetailsUrl && (
                                        <a href={row.workLinks.assigneeDetailsUrl} rel='noreferrer' target='_blank'>
                                            Assignee Details
                                            <IconOutline.ExternalLinkIcon />
                                        </a>
                                    )}
                                </div>
                            )}
                        </article>
                    ))}
                </div>
            )}
        </BaseModal>
    )
}

export default MemberHistoryModal
