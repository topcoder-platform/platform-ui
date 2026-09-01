/* eslint-disable react/jsx-no-bind */
import { CSSProperties, FC, Fragment, useState } from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'

import { IconOutline } from '~/libs/ui'

import { ChallengeOpportunity, ChallengePhase } from '../models'
import challengeCalendarIcon from '../assets/challenge-calendar.svg'
import challengeChevronIcon from '../assets/challenge-chevron.svg'
import challengeClockIcon from '../assets/challenge-clock.svg'
import challengeTypeIcon from '../assets/challenge-type.svg'
import challengeUploadIcon from '../assets/challenge-upload.svg'
import first2FinishTypeIcon from '../assets/first2finish-type.svg'
import marathonTypeIcon from '../assets/marathon-type.svg'
import medal1 from '../assets/medal-1.svg'
import medal10 from '../assets/medal-10.svg'
import medal2 from '../assets/medal-2.svg'
import medal3 from '../assets/medal-3.svg'
import medal4 from '../assets/medal-4.svg'
import medal5 from '../assets/medal-5.svg'
import medal6 from '../assets/medal-6.svg'
import medal7 from '../assets/medal-7.svg'
import medal8 from '../assets/medal-8.svg'
import medal9 from '../assets/medal-9.svg'
import taskTypeIcon from '../assets/task-type.svg'
import timelineAiScreeningIcon from '../assets/timeline-ai-screening.svg'
import timelineAppealsIcon from '../assets/timeline-appeals.svg'
import timelineAppealsResponseIcon from '../assets/timeline-appeals-response.svg'
import timelineLaunchIcon from '../assets/timeline-launch.svg'
import timelineRegistrationIcon from '../assets/timeline-registration.svg'
import timelineReviewIcon from '../assets/timeline-review.svg'
import timelineScreeningIcon from '../assets/timeline-screening.svg'
import timelineSubmissionIcon from '../assets/timeline-submission.svg'
import timelineWinnersIcon from '../assets/timeline-winners.svg'

import {
    challengeCatalogKey,
    challengeCurrentPhase,
    ChallengePlacementPrize,
    challengePlacementPrizes,
    challengeRegistrationIsOpen,
    challengeSubmissionIsOpen,
    FUN_CHALLENGE_PRIZE_LABEL,
} from './challenge-card.utils'
import styles from './ChallengeDetailHeader.module.scss'

interface ChallengeDetailHeaderProps {
    busy: boolean
    challenge: ChallengeOpportunity
    isRegistered: boolean
    onRegister: () => void
    onSubmit: () => void
    onUnregister: () => void
    registrationError?: boolean
    registrationLoading?: boolean
}

type ChallengeTimelineState = 'completed' | 'current' | 'upcoming'

interface ChallengeTimelineItem {
    endDate?: string
    icon: string
    key: string
    name: string
    range: boolean
    startDate?: string
    state: ChallengeTimelineState
}

interface ChallengePhaseSummary {
    phase: string
    qualifier?: string
    remaining?: string
}

/** Returns a catalog name from either v5-compatible or v6 challenge data. */
function catalogName(value: string | { name?: string } | undefined, fallback: string): string {
    return typeof value === 'string' ? value : value?.name || fallback
}

/**
 * Formats the compact same-year date range used by the challenge masthead.
 *
 * @param startValue phase or challenge start timestamp.
 * @param endValue phase or challenge end timestamp.
 * @returns member-facing date range or a schedule fallback.
 * @throws Does not throw; malformed dates use the fallback label.
 */
function dateRange(startValue?: string, endValue?: string): string {
    const start = startValue ? new Date(startValue) : undefined
    const end = endValue ? new Date(endValue) : undefined
    if (!start || Number.isNaN(start.getTime())) return 'Schedule to be announced'
    const month = new Intl.DateTimeFormat('en-US', { month: 'long' })
    const startLabel = `${start.getDate()} ${month.format(start)}`
    if (!end || Number.isNaN(end.getTime())) return `${startLabel}, ${start.getFullYear()}`
    const endLabel = `${end.getDate()} ${month.format(end)}, ${end.getFullYear()}`
    return `${startLabel} - ${endLabel}`
}

/**
 * Maps canonical challenge subtypes to the exported Topcoder glyphs.
 *
 * @param type Challenge API type label.
 * @returns local icon asset for the subtype tag.
 * @throws Does not throw; unknown types use the generic Challenge glyph.
 */
function typeIcon(type: string): string {
    const normalized = type.toLowerCase()
    if (normalized.includes('marathon')) return marathonTypeIcon
    if (normalized.includes('first2finish') || normalized.includes('first 2 finish') || normalized === 'f2f') {
        return first2FinishTypeIcon
    }

    if (normalized.includes('task')) return taskTypeIcon
    return challengeTypeIcon
}

/**
 * Formats the active phase and remaining time for the masthead metric.
 *
 * @param phase current or next challenge phase.
 * @returns phase, regular-weight qualifier, and optional remaining-time segments.
 * @throws Does not throw; absent and malformed dates use stable fallbacks.
 */
function phaseSummary(phase: ChallengePhase | undefined): ChallengePhaseSummary {
    if (!phase) return { phase: 'Timeline complete' }
    const endValue = phase.actualEndDate ?? phase.scheduledEndDate
    const end = endValue ? new Date(endValue) : undefined
    if (!end || Number.isNaN(end.getTime())) {
        return { phase: phase.name, qualifier: ' phase is active' }
    }
    const remainingMinutes = Math.max(0, Math.ceil((end.getTime() - Date.now()) / 60000))
    if (remainingMinutes === 0) return { phase: phase.name, qualifier: ' phase is active' }
    const days = Math.floor(remainingMinutes / 1440)
    const hours = Math.floor((remainingMinutes % 1440) / 60)
    const minutes = remainingMinutes % 60
    const parts = [
        days > 0 ? `${days}d` : '',
        hours > 0 ? `${hours}h` : '',
        days === 0 && minutes > 0 ? `${minutes}m` : '',
    ].filter(Boolean)
    return {
        phase: phase.name,
        qualifier: ' phase closes in ',
        remaining: parts.join(' '),
    }
}

/**
 * Formats one typed placement prize without assuming every reward is USD.
 *
 * @param prize Challenge API placement prize.
 * @returns localized currency, point, or typed-value label.
 * @throws Does not throw; unsupported currency codes fall back to typed text.
 */
function formatPrize(prize: ChallengePlacementPrize): string {
    const type = prize.type?.trim()
        .toUpperCase()
    const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
        .format(prize.value)
    if (type === 'POINT' || type === 'POINTS') return `${number} pts`
    const currency = type || 'USD'
    if (/^[A-Z]{3}$/.test(currency)) {
        try {
            return new Intl.NumberFormat('en-US', {
                currency,
                maximumFractionDigits: 2,
                minimumFractionDigits: 0,
                style: 'currency',
            })
                .format(prize.value)
        } catch {
            // Render the API's explicit reward type below.
        }
    }

    return type ? `${number} ${type}` : number
}

/**
 * Returns the exact Figma header-track color class for a catalog value.
 *
 * @param trackKey normalized Challenge API track key.
 * @returns scoped CSS class for Design, Development, Data Science, QA, or AI.
 * @throws Does not throw.
 */
function trackClass(trackKey: string): string {
    const classes: Record<string, string> = {
        ai: styles.aiTrack,
        artificialintelligence: styles.aiTrack,
        datascience: styles.dataScienceTrack,
        design: styles.designTrack,
        development: styles.developmentTrack,
        qualityassurance: styles.qaTrack,
    }
    return classes[trackKey] ?? styles.defaultTrack
}

/**
 * Converts an API date into a comparable timestamp.
 *
 * @param value ISO timestamp returned by Challenge API.
 * @returns finite timestamp, or undefined for absent and malformed values.
 * @throws Does not throw.
 */
function timelineTimestamp(value?: string): number | undefined {
    if (!value) return undefined
    const timestamp = Date.parse(value)
    return Number.isNaN(timestamp) ? undefined : timestamp
}

/**
 * Labels one expanded-timeline phase for visual completion state.
 *
 * @param phase scheduled challenge phase.
 * @param selected API-authoritative current phase.
 * @param currentPhaseNames every API-authoritative open phase name, including overlaps.
 * @returns completed, current, or upcoming state.
 * @throws Does not throw; malformed dates remain upcoming.
 */
function timelineState(
    phase: ChallengePhase,
    selected?: ChallengePhase,
    currentPhaseNames: string[] = [],
): ChallengeTimelineState {
    const phaseKey = challengeCatalogKey(phase.name)
    const selectedMatches = (selected?.id && phase.id === selected.id)
        || (!selected?.id && selected && challengeCatalogKey(selected.name) === phaseKey)
    const namedCurrent = currentPhaseNames.some(name => challengeCatalogKey(name) === phaseKey)
    if (phase.isOpen === true || selectedMatches || namedCurrent) return 'current'
    const endValue = phase.actualEndDate ?? phase.scheduledEndDate
    const end = timelineTimestamp(endValue)
    return end !== undefined && end <= Date.now() ? 'completed' : 'upcoming'
}

/**
 * Maps Challenge API phase names to the exact phase glyph exported from Figma.
 *
 * @param name authored Challenge API phase name.
 * @returns committed Figma icon asset for the phase family.
 * @throws Does not throw; unrecognized phases use the Review glyph.
 */
function timelinePhaseIcon(name: string): string {
    const key = challengeCatalogKey(name)
    if (key.includes('registration')) return timelineRegistrationIcon
    if (key.includes('submission') || key.includes('finalfix')) return timelineSubmissionIcon
    if (key.includes('aiscreening')) return timelineAiScreeningIcon
    if (key.includes('screening')) return timelineScreeningIcon
    if (key.includes('appealsresponse')) return timelineAppealsResponseIcon
    if (key.includes('appeals')) return timelineAppealsIcon
    return timelineReviewIcon
}

/**
 * Resolves the end represented by the terminal Winners milestone.
 *
 * @param challenge Challenge API detail response.
 * @returns the challenge end date, or the latest valid phase end when absent.
 * @throws Does not throw; malformed dates are ignored.
 */
function challengeTimelineEnd(challenge: ChallengeOpportunity): string | undefined {
    if (timelineTimestamp(challenge.endDate) !== undefined) return challenge.endDate
    return (challenge.phases ?? []).reduce<string | undefined>((latest, item) => {
        const candidate = item.actualEndDate ?? item.scheduledEndDate
        const candidateTimestamp = timelineTimestamp(candidate)
        const latestTimestamp = timelineTimestamp(latest)
        if (candidateTimestamp === undefined) return latest
        return latestTimestamp === undefined || candidateTimestamp > latestTimestamp ? candidate : latest
    }, undefined)
}

/**
 * Builds the Figma timeline sequence from Challenge API boundaries and phases.
 *
 * @param challenge Challenge API detail response.
 * @param selected API-authoritative current phase.
 * @returns Launch, authored phases, and terminal Winners timeline items in display order.
 * @throws Does not throw; absent dates are retained as announced-later labels.
 */
function challengeTimelineItems(
    challenge: ChallengeOpportunity,
    selected?: ChallengePhase,
): ChallengeTimelineItem[] {
    const now = Date.now()
    const startTimestamp = timelineTimestamp(challenge.startDate)
    const endDate = challengeTimelineEnd(challenge)
    const endTimestamp = timelineTimestamp(endDate)
    const phases = (challenge.phases ?? []).map((item, index): ChallengeTimelineItem => ({
        endDate: item.actualEndDate ?? item.scheduledEndDate,
        icon: timelinePhaseIcon(item.name),
        key: item.id ?? `phase-${challengeCatalogKey(item.name)}-${index}`,
        name: item.name,
        range: true,
        startDate: item.actualStartDate ?? item.scheduledStartDate,
        state: timelineState(item, selected, challenge.currentPhaseNames),
    }))

    return [{
        icon: timelineLaunchIcon,
        key: 'launch',
        name: 'Launch',
        range: false,
        startDate: challenge.startDate,
        state: startTimestamp !== undefined && startTimestamp <= now ? 'completed' : 'upcoming',
    }, ...phases, {
        icon: timelineWinnersIcon,
        key: 'winners',
        name: 'Winners',
        range: false,
        startDate: endDate,
        state: ((endTimestamp !== undefined && endTimestamp <= now)
            || challenge.status?.toUpperCase() === 'COMPLETED') ? 'completed' : 'upcoming',
    }]
}

/**
 * Labels the thick connector between two Figma timeline milestones.
 *
 * @param previous state of the milestone on the connector's left.
 * @param next state of the milestone on the connector's right.
 * @returns completed, current-progress, or upcoming connector state.
 * @throws Does not throw.
 */
function timelineConnectorState(
    previous: ChallengeTimelineState,
    next: ChallengeTimelineState,
): ChallengeTimelineState {
    if (previous === 'completed' && (next === 'completed' || next === 'current')) return 'completed'
    if (previous === 'current') return 'current'
    return 'upcoming'
}

/**
 * Formats one timeline timestamp as the two-row Figma date content expects.
 *
 * @param value ISO timestamp returned by Challenge API.
 * @returns local day, month, year, hour, and minute, or the schedule fallback.
 * @throws Does not throw; malformed dates use the fallback label.
 */
function timelineDate(value?: string): string {
    const timestamp = timelineTimestamp(value)
    if (timestamp === undefined) return 'To be announced'
    const parts = new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        hour: '2-digit',
        hour12: false,
        minute: '2-digit',
        month: 'long',
        year: 'numeric',
    })
        .formatToParts(new Date(timestamp))
    const day = parts.find(part => part.type === 'day')?.value
    const month = parts.find(part => part.type === 'month')?.value
    const year = parts.find(part => part.type === 'year')?.value
    const hour = parts.find(part => part.type === 'hour')?.value
    const minute = parts.find(part => part.type === 'minute')?.value
    return `${day} ${month}, ${year}, ${hour}:${minute}`
}

/**
 * Formats the browser timezone in the human-readable Figma label style.
 *
 * @returns local IANA timezone with spaced path separators.
 * @throws Does not throw; browsers without a timezone report UTC.
 */
function timelineTimezone(): string {
    const timezone = Intl.DateTimeFormat()
        .resolvedOptions()
        .timeZone || 'UTC'
    return timezone.replace(/_/g, ' ')
        .replace(/\//g, ' / ')
}

/**
 * Renders the Figma challenge title, phase context, prizes, and member actions.
 *
 * @param props challenge and registration state.
 * @returns dark challenge detail masthead.
 * @throws Does not throw.
 */
export const ChallengeDetailHeader: FC<ChallengeDetailHeaderProps> = props => {
    const [timelineOpen, setTimelineOpen] = useState(false)
    const phase = challengeCurrentPhase(props.challenge)
    const phaseCopy = phaseSummary(phase)
    const challengePrizes = challengePlacementPrizes(props.challenge)
    const type = catalogName(props.challenge.type, 'Challenge')
    const track = catalogName(props.challenge.track, 'Competition')
    const trackKey = challengeCatalogKey(props.challenge.track)
    const registrationOpen = challengeRegistrationIsOpen(props.challenge)
    const submissionOpen = challengeSubmissionIsOpen(props.challenge)
    const registrationUnavailable = props.registrationLoading || props.registrationError
    const canUnregister = props.isRegistered && registrationOpen && !registrationUnavailable && !props.busy
    const canSubmit = props.isRegistered && submissionOpen && !registrationUnavailable && !props.busy
    const medalAssets = [medal1, medal2, medal3, medal4, medal5, medal6, medal7, medal8, medal9, medal10]
    const featuredPrizes = challengePrizes.slice(0, 3)
    const additionalPrizes = challengePrizes.slice(3, medalAssets.length)
    const skills = props.challenge.skills ?? []
    const expandedTimeline = challengeTimelineItems(props.challenge, phase)
    const timelineGridStyle: CSSProperties = {
        gridTemplateColumns: [
            '88px',
            ...(props.challenge.phases ?? []).map(() => 'minmax(0, 1fr)'),
            '88px',
        ].join(' '),
    }

    return (
        <header className={styles.header}>
            <div className={styles.breadcrumbRow}>
                <div className={styles.breadcrumbs}>
                    <Link to='/opportunities'>Opportunities</Link>
                    <span>/</span>
                    <Link to='/opportunities/competitions'>Competitions</Link>
                    <span>/</span>
                    <span>{props.challenge.name}</span>
                </div>
            </div>
            <div className={styles.masthead}>
                <div className={styles.rings} aria-hidden='true' />
                <div className={styles.layout}>
                    <div className={styles.copy}>
                        <div className={styles.catalog}>
                            <span className={trackClass(trackKey)}>{track}</span>
                            <span>
                                <img alt='' aria-hidden='true' src={typeIcon(type)} />
                                {type}
                            </span>
                        </div>
                        <h1>{props.challenge.name}</h1>
                        {skills.length > 0 && (
                            <div className={classNames(styles.skills, {
                                [styles.designSkills]: trackKey === 'design',
                            })}
                            >
                                {skills
                                    .map(skill => <span key={skill.id ?? skill.name}>{skill.name}</span>)}
                            </div>
                        )}
                        <div className={styles.timeline}>
                            <span>
                                <img alt='' aria-hidden='true' src={challengeCalendarIcon} />
                                {dateRange(props.challenge.startDate, props.challenge.endDate)}
                            </span>
                            <span>
                                <img alt='' aria-hidden='true' src={challengeClockIcon} />
                                <span>
                                    <span>{phaseCopy.phase}</span>
                                    {phaseCopy.qualifier && (
                                        <span className={styles.phaseQualifier}>{phaseCopy.qualifier}</span>
                                    )}
                                    {phaseCopy.remaining && <span>{phaseCopy.remaining}</span>}
                                </span>
                            </span>
                            <button
                                aria-controls='challenge-timeline'
                                aria-expanded={timelineOpen}
                                onClick={() => setTimelineOpen(value => !value)}
                                type='button'
                            >
                                {timelineOpen ? 'Hide full timeline' : 'Show full timeline'}
                                <img alt='' aria-hidden='true' src={challengeChevronIcon} />
                            </button>
                        </div>
                    </div>
                    <aside className={styles.actionCard}>
                        <div className={styles.prizeFrame}>
                            <small>Prizes</small>
                            <div className={styles.prizes}>
                                {props.challenge.funChallenge
                                    ? <strong>{FUN_CHALLENGE_PRIZE_LABEL}</strong>
                                    : challengePrizes.length > 0
                                    ? (
                                        <>
                                            <div className={styles.featuredPrizes}>
                                                {featuredPrizes.map(prize => {
                                                    const medal = medalAssets[prize.placement - 1]
                                                    return (
                                                        <strong
                                                            key={`placement-${prize.placement}`}
                                                        >
                                                            <img alt={`${prize.placement} place`} src={medal} />
                                                            {formatPrize(prize)}
                                                        </strong>
                                                    )
                                                })}
                                            </div>
                                            {additionalPrizes.length > 0 && (
                                                <div
                                                    aria-label='Additional placement prizes'
                                                    className={styles.additionalPrizes}
                                                    role='group'
                                                >
                                                    {additionalPrizes.map(prize => {
                                                        const medal = medalAssets[prize.placement - 1]
                                                        return (
                                                            <strong
                                                                className={styles.secondaryPrize}
                                                                key={`placement-${prize.placement}`}
                                                            >
                                                                <img alt={`${prize.placement} place`} src={medal} />
                                                                {formatPrize(prize)}
                                                            </strong>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </>
                                    )
                                        : <strong>Prize details coming soon</strong>}
                            </div>
                        </div>
                        <div className={styles.actions}>
                            {props.isRegistered ? (
                                <>
                                    <button
                                        className={styles.secondary}
                                        disabled={!canUnregister}
                                        onClick={props.onUnregister}
                                        type='button'
                                    >
                                        Unregister
                                    </button>
                                    <button
                                        className={styles.primary}
                                        disabled={!canSubmit}
                                        onClick={props.onSubmit}
                                        type='button'
                                    >
                                        <img alt='' aria-hidden='true' src={challengeUploadIcon} />
                                        Submit a solution
                                    </button>
                                </>
                            ) : (
                                <button
                                    className={styles.primary}
                                    disabled={!registrationOpen || registrationUnavailable || props.busy}
                                    onClick={props.onRegister}
                                    type='button'
                                >
                                    {props.registrationLoading
                                        ? 'Checking registration…'
                                        : props.registrationError
                                            ? 'Registration unavailable'
                                            : registrationOpen ? 'Register' : 'Registration closed'}
                                </button>
                            )}
                        </div>
                    </aside>
                </div>
                {timelineOpen && (
                    <section
                        aria-label='Challenge timeline'
                        className={styles.expandedTimeline}
                        id='challenge-timeline'
                    >
                        <div className={styles.timelineGraphic}>
                            <div aria-hidden='true' className={styles.timelineRail}>
                                {expandedTimeline.map((item, index) => (
                                    <Fragment key={item.key}>
                                        {index > 0 && (
                                            <span
                                                className={classNames(
                                                    styles.timelineConnector,
                                                    styles[timelineConnectorState(
                                                        expandedTimeline[index - 1].state,
                                                        item.state,
                                                    )],
                                                )}
                                                data-state={timelineConnectorState(
                                                    expandedTimeline[index - 1].state,
                                                    item.state,
                                                )}
                                            />
                                        )}
                                        <span
                                            className={classNames(styles.timelineNode, styles[item.state])}
                                            data-state={item.state}
                                        >
                                            <img alt='' src={item.icon} />
                                        </span>
                                    </Fragment>
                                ))}
                            </div>
                            <ol className={styles.timelineItems} style={timelineGridStyle}>
                                {expandedTimeline.map(item => (
                                    <li className={styles[item.state]} data-state={item.state} key={item.key}>
                                        <strong>{item.name}</strong>
                                        <span className={styles.timelineDates}>
                                            {item.startDate ? (
                                                <time dateTime={item.startDate}>{timelineDate(item.startDate)}</time>
                                            ) : <span>{timelineDate()}</span>}
                                            {item.range && (item.endDate ? (
                                                <time dateTime={item.endDate}>{timelineDate(item.endDate)}</time>
                                            ) : <span>{timelineDate()}</span>)}
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                        <small className={styles.timelineTimezone}>
                            {`Time zone: ${timelineTimezone()}`}
                        </small>
                    </section>
                )}
            </div>
        </header>
    )
}
