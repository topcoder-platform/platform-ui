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

function getTrackColor(trackName?: string): string {
    const track = trackName?.toLowerCase()
    if (!track) {
        return '#0D61BF'
    }

    if (track.includes('design')) {
        return '#BA4E00'
    }

    if (track.includes('data')) {
        return '#1A7F4C'
    }

    if (track.includes('qa')) {
        return '#5B4CC4'
    }

    return '#0D61BF'
}

function getRegistrationDeadline(challenge: ChallengeInfo): string {
    if (challenge.currentPhaseEndDateString) {
        return challenge.currentPhaseEndDateString
    }

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
 * Renders a single challenge card row for the challenge listing page.
 *
 * @param props Challenge item and prize display mode.
 * @returns Challenge card row with challenge metadata and link.
 */
const ChallengeCard: FC<ChallengeCardProps> = (props: ChallengeCardProps) => {
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

    return (
        <article className={styles.card}>
            <div className={styles.header}>
                <Link className={styles.title} to={getChallengeDetailPath(props.challenge.id)}>
                    {props.challenge.name}
                </Link>
                <div className={styles.badges}>
                    <span
                        className={styles.trackBadge}
                        style={{ backgroundColor: getTrackColor(props.challenge.track?.name) }}
                    >
                        {props.challenge.track?.name || 'N/A'}
                    </span>
                    <span className={styles.typeBadge}>
                        {props.challenge.type?.name || 'N/A'}
                    </span>
                </div>
            </div>

            <dl className={styles.meta}>
                <div className={styles.metaItem}>
                    <dt>Prize</dt>
                    <dd>{prizeLabel}</dd>
                </div>
                <div className={styles.metaItem}>
                    <dt>Registration Deadline</dt>
                    <dd>{getRegistrationDeadline(props.challenge)}</dd>
                </div>
                <div className={styles.metaItem}>
                    <dt>Registrants</dt>
                    <dd>{props.challenge.numOfRegistrants.toLocaleString('en-US')}</dd>
                </div>
                <div className={styles.metaItem}>
                    <dt>Current Phase</dt>
                    <dd>{props.challenge.currentPhase?.name || 'N/A'}</dd>
                </div>
            </dl>
        </article>
    )
}

export default ChallengeCard
export type { ChallengeCardProps, PrizeMode }
