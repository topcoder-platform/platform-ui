import { FC } from 'react'
import { Link } from 'react-router-dom'

import { IconOutline } from '~/libs/ui'

import { ChallengeOpportunity, ChallengePhase } from '../models'

import styles from './ChallengeDetailHeader.module.scss'

interface ChallengeDetailHeaderProps {
    busy: boolean
    challenge: ChallengeOpportunity
    isRegistered: boolean
    onRegister: () => void
    onUnregister: () => void
}

/** Returns a catalog name from either v5-compatible or v6 challenge data. */
function catalogName(value: string | { name?: string } | undefined, fallback: string): string {
    return typeof value === 'string' ? value : value?.name || fallback
}

/** Formats a challenge date range for the hero. */
function dateRange(challenge: ChallengeOpportunity): string {
    const formatter = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    const start = challenge.startDate ? new Date(challenge.startDate) : undefined
    const end = challenge.endDate ? new Date(challenge.endDate) : undefined
    if (!start || Number.isNaN(start.getTime())) return 'Schedule to be announced'
    if (!end || Number.isNaN(end.getTime())) return formatter.format(start)
    return `${formatter.format(start)} – ${formatter.format(end)}`
}

/** Returns the first currently open phase for deadline display. */
function currentPhase(challenge: ChallengeOpportunity): ChallengePhase | undefined {
    return challenge.phases?.find(phase => phase.isOpen)
        ?? challenge.phases?.find(phase => {
            const end = phase.scheduledEndDate ? new Date(phase.scheduledEndDate) : undefined
            return end && end.getTime() > Date.now()
        })
}

/** Formats challenge prizes in placement order. */
function prizes(challenge: ChallengeOpportunity): number[] {
    const placement = challenge.prizeSets?.find(set => set.type?.toLowerCase() === 'placement')
        ?? challenge.prizeSets?.[0]
    return (placement?.prizes ?? []).map(prize => Number(prize.value ?? 0))
        .filter(value => value > 0)
}

/**
 * Renders the Figma challenge title, phase context, prizes, and member actions.
 *
 * @param props challenge and registration state.
 * @returns dark challenge detail masthead.
 * @throws Does not throw.
 */
export const ChallengeDetailHeader: FC<ChallengeDetailHeaderProps> = props => {
    const phase = currentPhase(props.challenge)
    const challengePrizes = prizes(props.challenge)
    const type = catalogName(props.challenge.type, 'Challenge')
    const track = catalogName(props.challenge.track, 'Competition')

    return (
        <header className={styles.header}>
            <div className={styles.rings} aria-hidden='true' />
            <div className={styles.inner}>
                <div className={styles.breadcrumbs}>
                    <Link to='/opportunities'>Opportunities</Link>
                    <span>/</span>
                    <Link to='/opportunities/competitions'>Competitions</Link>
                    <span>/</span>
                    <span>{props.challenge.name}</span>
                </div>
                <div className={styles.layout}>
                    <div className={styles.copy}>
                        <div className={styles.catalog}>
                            <span>{track}</span>
                            <span>{type}</span>
                        </div>
                        <h1>{props.challenge.name}</h1>
                        {(props.challenge.skills?.length ?? 0) > 0 && (
                            <div className={styles.skills}>
                                {props.challenge.skills?.slice(0, 6)
                                    .map(skill => <span key={skill.id ?? skill.name}>{skill.name}</span>)}
                            </div>
                        )}
                        <div className={styles.timeline}>
                            <span>
                                <IconOutline.CalendarIcon />
                                {dateRange(props.challenge)}
                            </span>
                            <span>
                                <IconOutline.ClockIcon />
                                {phase ? `${phase.name} phase is active` : 'Timeline complete'}
                            </span>
                            <a href='#challenge-timeline'>Show full timeline</a>
                        </div>
                    </div>
                    <aside className={styles.actionCard}>
                        <small>Prizes</small>
                        <div className={styles.prizes}>
                            {challengePrizes.length > 0
                                ? challengePrizes.slice(0, 3)
                                    .map((value, placementIndex) => {
                                        const placement = placementIndex + 1
                                        return (
                                            <strong key={`placement-${placement}`}>
                                                <span>{placement}</span>
                                                {new Intl.NumberFormat('en-US', {
                                                    currency: 'USD',
                                                    maximumFractionDigits: 0,
                                                    style: 'currency',
                                                })
                                                    .format(value)}
                                            </strong>
                                        )
                                    })
                                : <strong>Prize details coming soon</strong>}
                        </div>
                        <button
                            className={styles.secondary}
                            disabled={props.busy}
                            onClick={props.isRegistered ? props.onUnregister : props.onRegister}
                            type='button'
                        >
                            {props.isRegistered ? 'Unregister' : 'Register'}
                        </button>
                        <a
                            aria-disabled={!props.isRegistered}
                            className={styles.primary}
                            href={props.isRegistered ? `/challenges/${props.challenge.id}/submit` : undefined}
                        >
                            <IconOutline.UploadIcon />
                            Submit a solution
                        </a>
                    </aside>
                </div>
            </div>
        </header>
    )
}
