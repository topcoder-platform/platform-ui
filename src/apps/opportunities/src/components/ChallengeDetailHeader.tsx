/* eslint-disable react/jsx-no-bind */
import { CSSProperties, FC, useState } from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'

import { ChallengeOpportunity, ChallengePhase } from '../models'
import { isTaskChallenge } from '../utils/challenge-type.utils'
import { challengeTrackLabel } from '../utils/challenge-winner.utils'
import {
    formatOpportunityDateRange,
    formatOpportunityDateTime,
} from '../utils/opportunity-date.utils'
import challengeCalendarIcon from '../assets/challenge-calendar.svg'
import challengeChevronIcon from '../assets/challenge-chevron.svg'
import challengeClockIcon from '../assets/challenge-clock.svg'
import challengeTypeIcon from '../assets/challenge-type.svg'
import challengeUploadIcon from '../assets/challenge-upload.svg'
import first2FinishTypeIcon from '../assets/first2finish-type.svg'
import marathonTypeIcon from '../assets/marathon-type.svg'
import medal1 from '../assets/medal-1.svg'
import medal10 from '../assets/medal-10.svg'
import medal4 from '../assets/medal-4.svg'
import medal5 from '../assets/medal-5.svg'
import medal6 from '../assets/medal-6.svg'
import medal7 from '../assets/medal-7.svg'
import medal8 from '../assets/medal-8.svg'
import medal9 from '../assets/medal-9.svg'
import prizeMedal2 from '../assets/prize-medal-2.svg'
import prizeMedal3 from '../assets/prize-medal-3.svg'
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
    challengeCheckpointAwards,
    challengeCurrentPhase,
    challengeIsCancelled,
    ChallengePlacementPrize,
    challengePlacementPrizes,
    challengeRegistrationIsOpen,
    challengeSubmissionIsOpen,
    FUN_CHALLENGE_PRIZE_LABEL,
    isPostMortemPhase,
} from './challenge-card.utils'
import styles from './ChallengeDetailHeader.module.scss'

interface ChallengeDetailHeaderProps {
    busy: boolean
    challenge: ChallengeOpportunity
    hasSubmitted?: boolean
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

interface IndexedChallengePhase {
    index: number
    item: ChallengePhase
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
    return formatOpportunityDateRange(startValue, endValue, 'Schedule to be announced')
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
 * @param challengeStatus challenge lifecycle status used when no phase is active.
 * @returns phase, regular-weight qualifier, and optional remaining-time segments.
 * @throws Does not throw; absent and malformed dates use stable fallbacks.
 */
function phaseSummary(
    phase: ChallengePhase | undefined,
    challengeStatus?: string,
): ChallengePhaseSummary {
    if (!phase) {
        const statusKey = challengeCatalogKey(challengeStatus)
        if (statusKey === 'completed') return { phase: 'Challenge completed' }

        const status = challengeStatus?.trim()
            .replace(/[_-]+/g, ' ')
            .replace(/\s+/g, ' ')
            .toLowerCase()
        return {
            phase: status
                ? `${status.charAt(0)
                    .toUpperCase()}${status.slice(1)}`
                : 'Schedule to be announced',
        }
    }

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

/** One authored tag or standardized skill shown in the challenge masthead. */
interface ChallengeLabel {
    /** Authored challenge tags read as outlined pills; skills read as filled chips. */
    isTag: boolean
    label: string
}

/**
 * Deduplicates a challenge's authored tags and standardized skills, flagging
 * which is which so the masthead can render them differently.
 *
 * Tags come first, matching the Aug 2026 Opportunities design, and a skill that
 * repeats a tag is dropped rather than shown twice.
 *
 * @param challenge Challenge API detail response.
 * @returns non-empty labels in stable source order, tags before skills.
 * @throws Does not throw.
 */
function challengeLabels(challenge: ChallengeOpportunity): ChallengeLabel[] {
    const seen = new Set<string>()
    return [
        ...(challenge.tags ?? []).map(label => ({ isTag: true, label })),
        ...(challenge.skills ?? []).map(skill => ({ isTag: false, label: skill.name })),
    ]
        .map(entry => ({ ...entry, label: entry.label?.trim() ?? '' }))
        .filter(entry => {
            if (!entry.label || seen.has(entry.label)) return false
            seen.add(entry.label)
            return true
        })
}

/**
 * Formats one typed placement prize without assuming every reward is USD.
 *
 * @param prize Challenge API placement prize.
 * @returns localized currency, point, or typed-value label.
 * @throws Does not throw; unsupported currency codes fall back to typed text.
 */
function formatPrize(prize: Pick<ChallengePlacementPrize, 'type' | 'value'>): string {
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
 * Authored phases stay chronological, with Registration first when valid starts match.
 * Task timelines omit Iterative Review because that phase is not member-facing for Tasks.
 * Every timeline omits Post-Mortem, which Autopilot opens for the copilot after a
 * cancellation and which community-app never showed to members.
 *
 * @param challenge Challenge API detail response.
 * @param selected API-authoritative current phase.
 * @returns Launch, visible authored phases, and terminal Winners items in display order.
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
    const taskChallenge = isTaskChallenge(challenge)
    const authoredPhases = (challenge.phases ?? []).filter(item => (
        !isPostMortemPhase(item)
        && (!taskChallenge || !challengeCatalogKey(item.name)
            .includes('iterativereview'))
    ))
    const phases = authoredPhases
        .map((item, index) => ({ index, item }))
        .sort((left: IndexedChallengePhase, right: IndexedChallengePhase) => {
            const leftKey = challengeCatalogKey(left.item.name)
            const rightKey = challengeCatalogKey(right.item.name)
            const leftIsRegistration = leftKey.includes('registration')
            const rightIsRegistration = rightKey.includes('registration')
            if (taskChallenge) {
                if (leftIsRegistration !== rightIsRegistration) return leftIsRegistration ? -1 : 1
            }

            const leftStartTimestamp = timelineTimestamp(
                left.item.actualStartDate ?? left.item.scheduledStartDate,
            )
            const rightStartTimestamp = timelineTimestamp(
                right.item.actualStartDate ?? right.item.scheduledStartDate,
            )
            const leftStart = leftStartTimestamp ?? Number.MAX_SAFE_INTEGER
            const rightStart = rightStartTimestamp ?? Number.MAX_SAFE_INTEGER
            if (leftStart !== rightStart) return leftStart - rightStart
            if (leftStartTimestamp !== undefined && leftIsRegistration !== rightIsRegistration) {
                return leftIsRegistration ? -1 : 1
            }

            const leftEnd = timelineTimestamp(
                left.item.actualEndDate ?? left.item.scheduledEndDate,
            ) ?? Number.MAX_SAFE_INTEGER
            const rightEnd = timelineTimestamp(
                right.item.actualEndDate ?? right.item.scheduledEndDate,
            ) ?? Number.MAX_SAFE_INTEGER
            if (leftEnd !== rightEnd) return leftEnd - rightEnd

            return left.index - right.index
        })
        .map((entry: IndexedChallengePhase): ChallengeTimelineItem => ({
            endDate: entry.item.actualEndDate ?? entry.item.scheduledEndDate,
            icon: timelinePhaseIcon(entry.item.name),
            key: entry.item.id ?? `phase-${challengeCatalogKey(entry.item.name)}-${entry.index}`,
            name: entry.item.name,
            range: true,
            startDate: entry.item.actualStartDate ?? entry.item.scheduledStartDate,
            state: timelineState(entry.item, selected, challenge.currentPhaseNames),
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
 * @returns local `day month year, hour:minute` such as `17 Sep 2026, 14:39`, or the schedule fallback.
 * @throws Does not throw; malformed dates use the fallback label.
 */
function timelineDate(value?: string): string {
    const timestamp = timelineTimestamp(value)
    if (timestamp === undefined) return 'To be announced'
    return formatOpportunityDateTime(new Date(timestamp)
        .toISOString(), 'To be announced')
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
 * Renders the Figma challenge title, authored tags, standardized skills, phase
 * context, prizes, and competition member actions. Tags precede skills and read
 * as outlined pills so they are distinct from the filled skill chips, with
 * blank and duplicate labels omitted. Assignment-only Task challenges omit actions.
 * Featured placement prizes shrink to a compact size for long or point-based
 * labels and to a dense size once lower placement prizes are also shown, and the
 * row wraps so wide amounts stay inside the prize frame.
 *
 * @param props challenge and registration state.
 * @returns dark challenge detail masthead with Task-aware action visibility.
 * @throws Does not throw.
 */
export const ChallengeDetailHeader: FC<ChallengeDetailHeaderProps> = props => {
    const [timelineOpen, setTimelineOpen] = useState(false)
    const cancelled = challengeIsCancelled(props.challenge)
    const currentPhase = challengeCurrentPhase(props.challenge)
    // A cancelled challenge keeps its Post-Mortem phase open for the copilot. The
    // masthead must read the cancellation, not a countdown to that phase's close.
    const phase = cancelled || isPostMortemPhase(currentPhase) ? undefined : currentPhase
    const phaseCopy = phaseSummary(phase, props.challenge.status)
    const challengePrizes = challengePlacementPrizes(props.challenge)
    const checkpointAwards = challengeCheckpointAwards(props.challenge)
    const type = catalogName(props.challenge.type, 'Challenge')
    const track = challengeTrackLabel(props.challenge.track, 'Competition')
    const trackKey = challengeCatalogKey(props.challenge.track)
    const taskChallenge = isTaskChallenge(props.challenge)
    const registrationOpen = challengeRegistrationIsOpen(props.challenge)
    const submissionOpen = challengeSubmissionIsOpen(props.challenge)
    const challengeStatusKey = challengeCatalogKey(props.challenge.status)
    // Every cancellation reason reads as a cancelled challenge, including the
    // `CANCELLED_ZERO_SUBMISSIONS` status Autopilot sets when a challenge closes
    // with nothing submitted.
    const showInactiveActions = cancelled || ['completed', 'draft'].includes(challengeStatusKey)
    const registrationUnavailable = props.registrationLoading || props.registrationError
    const canUnregister = props.isRegistered
        && !props.hasSubmitted
        && registrationOpen
        && !registrationUnavailable
        && !props.busy
    const canSubmit = props.isRegistered && submissionOpen && !registrationUnavailable && !props.busy
    const medalAssets = [
        medal1,
        prizeMedal2,
        prizeMedal3,
        medal4,
        medal5,
        medal6,
        medal7,
        medal8,
        medal9,
        medal10,
    ]
    const featuredPrizes = challengePrizes.slice(0, 3)
    const additionalPrizes = challengePrizes.slice(3, medalAssets.length)
    const featuredPrizeLabels = featuredPrizes.map(prize => formatPrize(prize))
    const compactFeaturedPrizes = featuredPrizes.some((prize, index) => {
        const prizeType = prize.type?.trim()
            .toUpperCase()
        return prizeType === 'POINT' || prizeType === 'POINTS' || featuredPrizeLabels[index].length > 8
    })
    // Per design, the top tier drops to 22px once the card also has to carry
    // lower placement prizes, so the three featured amounts stay inside the frame.
    const denseFeaturedPrizes = challengePrizes.length > 3
    const labels = challengeLabels(props.challenge)
    const expandedTimeline = challengeTimelineItems(props.challenge, phase)
    const timelineGridStyle: CSSProperties = {
        gridTemplateColumns: `repeat(${expandedTimeline.length}, minmax(160px, 1fr))`,
    }
    const timelineWidthStyle = {
        '--timeline-min-width': `${expandedTimeline.length * 160 + (expandedTimeline.length - 1) * 4}px`,
    } as CSSProperties

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
                <div className={styles.rings} aria-hidden='true'>
                    <span className={classNames(styles.ring, styles.ringOuter)} />
                    <span className={classNames(styles.ring, styles.ringMiddle)} />
                    <span className={classNames(styles.ring, styles.ringInner)} />
                </div>
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
                        {labels.length > 0 && (
                            <div className={styles.skills}>
                                {labels.map(entry => (
                                    <Link
                                        className={classNames({ [styles.tagLabel]: entry.isTag })}
                                        key={entry.label}
                                        to={`/opportunities/competitions?search=${
                                            encodeURIComponent(entry.label)}`}
                                    >
                                        {entry.label}
                                    </Link>
                                ))}
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
                                {timelineOpen ? 'Hide timeline' : 'Show full timeline'}
                                <img alt='' aria-hidden='true' src={challengeChevronIcon} />
                            </button>
                        </div>
                    </div>
                    <aside className={styles.actionCard}>
                        <div className={styles.prizeFrame}>
                            <small className={styles.prizeTitle}>Prizes</small>
                            <div className={styles.prizes}>
                                {props.challenge.funChallenge
                                    ? (
                                        <strong className={styles.funChallengePrize}>
                                            {FUN_CHALLENGE_PRIZE_LABEL}
                                        </strong>
                                    )
                                    : challengePrizes.length > 0
                                        ? (
                                            <>
                                                <div className={classNames(styles.featuredPrizes, {
                                                    [styles.compactFeaturedPrizes]: compactFeaturedPrizes,
                                                    [styles.denseFeaturedPrizes]: denseFeaturedPrizes,
                                                })}
                                                >
                                                    {featuredPrizes.map((prize, index) => {
                                                        const medal = medalAssets[prize.placement - 1]
                                                        return (
                                                            <strong
                                                                className={classNames({
                                                                    [styles.compactPrize]: compactFeaturedPrizes,
                                                                    [styles.densePrize]: denseFeaturedPrizes,
                                                                })}
                                                                key={`placement-${prize.placement}`}
                                                            >
                                                                <img alt={`${prize.placement} place`} src={medal} />
                                                                {featuredPrizeLabels[index]}
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
                                        : !checkpointAwards.length && (
                                            <strong>Prize details coming soon</strong>
                                        )}
                            </div>
                            {checkpointAwards.map(award => (
                                <div className={styles.checkpointAward} key={`${award.type}-${award.value}`}>
                                    <span>additional</span>
                                    <span className={styles.checkpointCount}>{`${award.count}x`}</span>
                                    <strong>{formatPrize(award)}</strong>
                                    <span>{award.count === 1 ? 'checkpoint prize' : 'checkpoint prizes'}</span>
                                </div>
                            ))}
                        </div>
                        {!taskChallenge && (
                            <div className={styles.actions}>
                                {props.isRegistered || showInactiveActions ? (
                                    <>
                                        <button
                                            className={styles.secondary}
                                            data-analytics-id={props.isRegistered
                                                ? 'challenge-unregister'
                                                : 'challenge-register'}
                                            data-analytics-placement='challenge-header'
                                            disabled={props.isRegistered
                                                ? !canUnregister
                                                : !registrationOpen || registrationUnavailable || props.busy}
                                            onClick={props.isRegistered ? props.onUnregister : props.onRegister}
                                            type='button'
                                        >
                                            {props.isRegistered ? 'Unregister' : 'Register'}
                                        </button>
                                        <button
                                            className={styles.primary}
                                            data-analytics-id='challenge-submit-start'
                                            data-analytics-placement='challenge-header'
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
                                        className={styles.secondary}
                                        data-analytics-id='challenge-register'
                                        data-analytics-placement='challenge-header'
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
                        )}
                    </aside>
                    {timelineOpen && (
                        <section
                            aria-label='Challenge timeline'
                            className={styles.expandedTimeline}
                            id='challenge-timeline'
                        >
                            <small className={styles.timelineTimezone}>
                                {`Time zone: ${timelineTimezone()}`}
                            </small>
                            <div className={styles.timelineGraphic} style={timelineWidthStyle}>
                                <div aria-hidden='true' className={styles.timelineRail} style={timelineGridStyle}>
                                    {expandedTimeline.map((item, index) => (
                                        <span className={styles.timelineMilestone} key={item.key}>
                                            <span
                                                className={classNames(
                                                    styles.timelineNode,
                                                    styles[item.state],
                                                )}
                                                data-state={item.state}
                                            >
                                                <img alt='' src={item.icon} />
                                            </span>
                                            {index < expandedTimeline.length - 1 && (
                                                <span
                                                    className={classNames(
                                                        styles.timelineConnector,
                                                        styles[timelineConnectorState(
                                                            item.state,
                                                            expandedTimeline[index + 1].state,
                                                        )],
                                                    )}
                                                    data-state={timelineConnectorState(
                                                        item.state,
                                                        expandedTimeline[index + 1].state,
                                                    )}
                                                />
                                            )}
                                        </span>
                                    ))}
                                </div>
                                <ol className={styles.timelineItems} style={timelineGridStyle}>
                                    {expandedTimeline.map((item, index) => (
                                        <li className={styles[item.state]} data-state={item.state} key={item.key}>
                                            <span aria-hidden='true' className={styles.mobileTimelineMarker}>
                                                <span
                                                    className={classNames(styles.timelineNode, styles[item.state])}
                                                >
                                                    <img alt='' src={item.icon} />
                                                </span>
                                                {index < expandedTimeline.length - 1 && (
                                                    <span
                                                        className={classNames(
                                                            styles.timelineConnector,
                                                            styles[timelineConnectorState(
                                                                item.state,
                                                                expandedTimeline[index + 1].state,
                                                            )],
                                                        )}
                                                    />
                                                )}
                                            </span>
                                            <strong>{item.name}</strong>
                                            <span className={styles.timelineDates}>
                                                {item.startDate ? (
                                                    <time dateTime={item.startDate}>
                                                        {timelineDate(item.startDate)}
                                                    </time>
                                                ) : <span>{timelineDate()}</span>}
                                                {item.range && (item.endDate ? (
                                                    <time dateTime={item.endDate}>{timelineDate(item.endDate)}</time>
                                                ) : <span>{timelineDate()}</span>)}
                                            </span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </header>
    )
}
