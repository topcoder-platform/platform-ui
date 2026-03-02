import { FC, useMemo } from 'react'
import { generatePath, Link } from 'react-router-dom'
import moment from 'moment'

import { challengeDetailRouteId, rootRoute } from '../../../config/routes.config'
import { ChallengeInfo } from '../../../lib'

import styles from './ChallengeCard.module.scss'

const DATE_FORMAT = 'MMM DD YYYY, HH:mm A'

type PrizeMode = 'money-usd' | 'points'

interface ChallengeCardProps {
    challenge: ChallengeInfo
    prizeMode?: PrizeMode
}

interface ChallengeWithOverview extends ChallengeInfo {
    overview?: {
        totalPrizes?: number
    }
}

const TYPE_ABBREVIATIONS_BY_NAME: Readonly<Record<string, string>> = {
    challenge: 'CH',
    first2finish: 'F2F',
    marathonmatch: 'MM',
    task: 'TSK',
}

const TYPE_BG_COLORS: Readonly<Record<string, string>> = {
    CH: 'rgba(22, 103, 154, 0.5)',
    F2F: '#0D61BF',
    MM: '#1A7F4C',
    TSK: '#1C9B9B',
}

const TYPE_TEXT_COLORS: Readonly<Record<string, string>> = {
    CH: '#2A2A2A',
    F2F: '#FFFFFF',
    MM: '#FFFFFF',
    TSK: '#FFFFFF',
}

function getTypeColor(typeAbbreviation: string): string {
    return TYPE_BG_COLORS[typeAbbreviation] ?? '#0D61BF'
}

function getTypeTextColor(typeAbbreviation: string): string {
    return TYPE_TEXT_COLORS[typeAbbreviation] ?? '#FFFFFF'
}

function normalizeTypeName(name?: string): string {
    return (name ?? '').replace(/[^a-z0-9]/gi, '')
        .toLowerCase()
}

function getTypeAbbreviation(challenge: ChallengeInfo): string {
    const rawAbbreviation = challenge.type?.abbreviation?.trim()
    if (rawAbbreviation) {
        return rawAbbreviation.toUpperCase()
    }

    const mappedAbbreviation = TYPE_ABBREVIATIONS_BY_NAME[normalizeTypeName(challenge.type?.name)]
    if (mappedAbbreviation) {
        return mappedAbbreviation
    }

    const name = challenge.type?.name?.trim() ?? ''
    if (!name) {
        return 'CH'
    }

    const words = name.split(/\s+/)
        .filter(Boolean)
    if (words.length >= 2) {
        return `${words[0][0]}${words[1][0]}`
            .toUpperCase()
    }

    return name.slice(0, 3)
        .toUpperCase()
}

function getRegistrationEndDate(challenge: ChallengeInfo): string {
    const registrationPhase = challenge.phases.find(
        phase => phase.name.toLowerCase()
            .includes('registration'),
    )
    const date = registrationPhase?.actualEndDate ?? registrationPhase?.scheduledEndDate

    if (!date) {
        return 'N/A'
    }

    return moment(date)
        .local()
        .format(DATE_FORMAT)
}

function getActiveNonRegistrationPhase(
    challenge: ChallengeInfo,
): ChallengeInfo['phases'][number] | undefined {
    return challenge.phases
        .filter(phase => (
            Boolean(phase.isOpen)
            && phase.name.toLowerCase() !== 'registration'
        ))
        .sort((a, b) => moment(a.scheduledEndDate)
            .diff(b.scheduledEndDate))[0]
}

/**
 * Calculates current open phase progress as a percentage in range [0, 100].
 *
 * @param challenge Challenge model with phases.
 * @returns Progress percentage for the current open non-registration phase.
 */
export function getPhaseProgress(challenge: ChallengeInfo): number {
    const phase = getActiveNonRegistrationPhase(challenge)
    if (!phase?.actualStartDate || !phase?.scheduledEndDate) {
        return 0
    }

    const start = moment(phase.actualStartDate)
    const end = moment(phase.scheduledEndDate)

    if (!start.isValid() || !end.isValid() || !end.isAfter(start)) {
        return 0
    }

    const totalMs = end.diff(start)
    const elapsedMs = moment()
        .diff(start)
    const progress = (elapsedMs / totalMs) * 100

    return Math.min(Math.max(progress, 0), 100)
}

function getCurrentPhaseName(challenge: ChallengeInfo): string {
    return getActiveNonRegistrationPhase(challenge)?.name
        ?? challenge.currentPhase?.name
        ?? 'Stalled'
}

function getTimeLeftLabel(challenge: ChallengeInfo): string {
    if (!challenge.timeLeft || challenge.timeLeft === 'Ended') {
        return 'Ended'
    }

    return `${challenge.timeLeft} to go`
}

/**
 * Builds a challenge detail path scoped to the community app root route.
 *
 * @param challengeId Challenge identifier.
 * @returns Absolute challenge detail route path.
 */
function getChallengeDetailPath(challengeId: string): string {
    const detailPath = generatePath(challengeDetailRouteId, { challengeId })
    const routePath = `${rootRoute}/${detailPath}`
        .replace(/\/{2,}/g, '/')

    return routePath.startsWith('/')
        ? routePath
        : `/${routePath}`
}

/**
 * Renders a single challenge row for the challenge listing page.
 *
 * @param props Challenge item and prize display mode.
 * @returns Challenge row with left details, prize and status sections.
 */
const ChallengeCard: FC<ChallengeCardProps> = (props: ChallengeCardProps) => {
    const detailPath = useMemo(
        () => getChallengeDetailPath(props.challenge.id),
        [props.challenge.id],
    )
    const totalPrizes = useMemo(
        () => (props.challenge as ChallengeWithOverview).overview?.totalPrizes ?? 0,
        [props.challenge],
    )
    const prizeLabel = useMemo(() => {
        if (!totalPrizes) {
            return 'N/A'
        }

        if (props.prizeMode === 'points') {
            return `${totalPrizes.toLocaleString('en-US')} pts`
        }

        return new Intl.NumberFormat(
            'en-US',
            {
                currency: 'USD',
                maximumFractionDigits: 0,
                style: 'currency',
            },
        )
            .format(totalPrizes)
    }, [props.prizeMode, totalPrizes])
    const phaseProgress = useMemo(
        () => getPhaseProgress(props.challenge),
        [props.challenge],
    )
    const typeAbbreviation = useMemo(
        () => getTypeAbbreviation(props.challenge),
        [props.challenge],
    )
    const totalSubmissions = props.challenge.numOfSubmissions
        + (props.challenge.numOfCheckpointSubmissions ?? 0)

    return (
        <article className={styles.card}>
            <div className={styles.leftPanel}>
                <span
                    className={styles.trackIcon}
                    style={{
                        backgroundColor: getTypeColor(typeAbbreviation),
                        color: getTypeTextColor(typeAbbreviation),
                    }}
                >
                    {typeAbbreviation}
                </span>

                <div className={styles.challengeInfo}>
                    <Link className={styles.title} to={detailPath}>
                        {props.challenge.name}
                    </Link>
                    <span className={styles.endDate}>
                        Ends
                        {' '}
                        {getRegistrationEndDate(props.challenge)}
                    </span>
                    <div className={styles.tags}>
                        {props.challenge.tags.slice(0, 4)
                            .map(tag => (
                                <span className={styles.tag} key={tag} title={tag}>
                                    {tag}
                                </span>
                            ))}
                    </div>
                </div>
            </div>

            <div className={styles.prizePanel}>
                <div className={styles.prizeValue}>{prizeLabel}</div>
                <div className={styles.prizeCaption}>Purse</div>
            </div>

            <div className={styles.statusPanel}>
                <div className={styles.phaseName}>{getCurrentPhaseName(props.challenge)}</div>
                <div className={styles.progressBar}>
                    <span
                        className={styles.progressValue}
                        style={{ width: `${phaseProgress}%` }}
                    />
                </div>
                <div className={styles.timeLeft}>{getTimeLeftLabel(props.challenge)}</div>
                <div className={styles.stats}>
                    <Link className={styles.statLink} to={`${detailPath}?tab=registrants`}>
                        <span aria-hidden>&#128100;</span>
                        {props.challenge.numOfRegistrants.toLocaleString('en-US')}
                    </Link>
                    <Link className={styles.statLink} to={`${detailPath}?tab=submissions`}>
                        <span aria-hidden>&#128196;</span>
                        {totalSubmissions.toLocaleString('en-US')}
                    </Link>
                </div>
            </div>
        </article>
    )
}

export default ChallengeCard
export type { ChallengeCardProps, PrizeMode }
