/* eslint-disable react/jsx-no-bind */
import { FC, useState } from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'

import { IconOutline } from '~/libs/ui'

import { ChallengeOpportunity, ChallengePhase } from '../models'
import challengeTypeIcon from '../assets/challenge-type.svg'
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

import {
    challengeCatalogKey,
    challengeCurrentPhase,
    ChallengePlacementPrize,
    challengePlacementPrizes,
    challengeRegistrationIsOpen,
    challengeSubmissionIsOpen,
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
 * @returns phase deadline summary suitable for a compact metric.
 * @throws Does not throw; absent and malformed dates use stable fallbacks.
 */
function phaseSummary(phase: ChallengePhase | undefined): string {
    if (!phase) return 'Timeline complete'
    const endValue = phase.actualEndDate ?? phase.scheduledEndDate
    const end = endValue ? new Date(endValue) : undefined
    if (!end || Number.isNaN(end.getTime())) return `${phase.name} phase is active`
    const remainingMinutes = Math.max(0, Math.ceil((end.getTime() - Date.now()) / 60000))
    if (remainingMinutes === 0) return `${phase.name} phase is active`
    const days = Math.floor(remainingMinutes / 1440)
    const hours = Math.floor((remainingMinutes % 1440) / 60)
    const minutes = remainingMinutes % 60
    const parts = [
        days > 0 ? `${days}d` : '',
        hours > 0 ? `${hours}h` : '',
        days === 0 && minutes > 0 ? `${minutes}m` : '',
    ].filter(Boolean)
    return `${phase.name} phase closes in ${parts.join(' ')}`
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
 * Labels one expanded-timeline phase for visual completion state.
 *
 * @param phase scheduled challenge phase.
 * @param selected API-authoritative current phase.
 * @returns completed, current, or upcoming state.
 * @throws Does not throw; malformed dates remain upcoming.
 */
function timelineState(phase: ChallengePhase, selected?: ChallengePhase): 'completed' | 'current' | 'upcoming' {
    if ((selected?.id && phase.id === selected.id) || (!selected?.id && selected === phase)) return 'current'
    const endValue = phase.actualEndDate ?? phase.scheduledEndDate
    const end = endValue ? new Date(endValue) : undefined
    return end && !Number.isNaN(end.getTime()) && end.getTime() <= Date.now() ? 'completed' : 'upcoming'
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
    const skills = props.challenge.skills ?? []

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
                                <IconOutline.CalendarIcon />
                                {dateRange(props.challenge.startDate, props.challenge.endDate)}
                            </span>
                            <span>
                                <IconOutline.ClockIcon />
                                {phaseSummary(phase)}
                            </span>
                            <button
                                aria-controls='challenge-timeline'
                                aria-expanded={timelineOpen}
                                onClick={() => setTimelineOpen(value => !value)}
                                type='button'
                            >
                                {timelineOpen ? 'Hide full timeline' : 'Show full timeline'}
                                <IconOutline.ChevronDownIcon />
                            </button>
                        </div>
                    </div>
                    <aside className={styles.actionCard}>
                        <div className={classNames(styles.prizeFrame, {
                            [styles.extendedPrizeFrame]: challengePrizes.length > 3,
                        })}
                        >
                            <small>Prizes</small>
                            <div className={styles.prizes}>
                                {challengePrizes.length > 0
                                    ? challengePrizes.slice(0, medalAssets.length)
                                        .map(prize => {
                                            const medal = medalAssets[prize.placement - 1]
                                            return (
                                                <strong
                                                    className={prize.placement <= 3
                                                        ? styles.primaryPrize
                                                        : styles.secondaryPrize}
                                                    key={`placement-${prize.placement}`}
                                                >
                                                    <img alt={`${prize.placement} place`} src={medal} />
                                                    {formatPrize(prize)}
                                                </strong>
                                            )
                                        })
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
                                        <IconOutline.UploadIcon />
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
                    <ol className={styles.expandedTimeline} id='challenge-timeline'>
                        {(props.challenge.phases ?? []).map(item => (
                            <li
                                className={styles[timelineState(item, phase)]}
                                key={item.id ?? item.name}
                            >
                                <span />
                                <strong>{item.name}</strong>
                                <small>
                                    {dateRange(
                                        item.actualStartDate ?? item.scheduledStartDate,
                                        item.actualEndDate ?? item.scheduledEndDate,
                                    )}
                                </small>
                            </li>
                        ))}
                    </ol>
                )}
            </div>
        </header>
    )
}
