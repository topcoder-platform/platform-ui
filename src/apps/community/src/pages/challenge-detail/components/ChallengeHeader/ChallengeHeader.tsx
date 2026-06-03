/* eslint-disable complexity */
import { FC, MouseEvent, useCallback, useMemo } from 'react'
import { generatePath, Link } from 'react-router-dom'
import classNames from 'classnames'
import moment from 'moment'

import {
    Button,
    IconOutline,
    type TabsNavItem,
} from '~/libs/ui'

import {
    challengeDetailRouteId,
    rootRoute,
} from '../../../../config/routes.config'
import {
    type BackendChallengePhase,
    type BackendChallengeWinner,
    ChallengeInfo,
    isDesignChallenge,
    PlacementPrize,
} from '../../../../lib'

import styles from './ChallengeHeader.module.scss'

type ChallengeDetailTabId = 'checkpoints' | 'details' | 'discussion' | 'registrants' | 'submissions' | 'winners'

interface ChallengeHeaderProps {
    activeTab: ChallengeDetailTabId
    challenge: ChallengeInfo
    challengePrizes: PlacementPrize[]
    challengesUrl: string
    displayWinners: BackendChallengeWinner[]
    hasRegistered: boolean
    isLegacyMM: boolean
    isLoggedIn: boolean
    mySubmissions: Array<{ id: string }>
    onRegisterClick: () => void
    onTabChange: (tab: ChallengeDetailTabId) => void
    onToggleDeadlines: () => void
    onUnregisterClick: () => void
    registering: boolean
    showDeadlineDetail: boolean
    submissionEnded: boolean
    tabs: ReadonlyArray<TabsNavItem<ChallengeDetailTabId>>
    unregistering: boolean
}

function formatDate(date: string | undefined): string {
    if (!date) {
        return 'TBD'
    }

    return moment(date)
        .local()
        .format('MMM DD, YYYY HH:mm')
}

function getPhaseEndDate(phase: BackendChallengePhase): string | undefined {
    return phase.actualEndDate ?? phase.scheduledEndDate
}

function toTypeName(challenge: ChallengeInfo): string {
    if (typeof challenge.type === 'string') {
        return challenge.type
    }

    return challenge.type.name
}

/**
 * Formats a placement prize value for the header prize strip.
 *
 * @param prize Challenge placement prize.
 * @returns Human-readable prize value.
 */
function formatPrizeValue(prize: PlacementPrize): string {
    if (prize.type === 'POINT') {
        return `${prize.value.toLocaleString('en-US')} pts`
    }

    return new Intl.NumberFormat('en-US', {
        currency: 'USD',
        maximumFractionDigits: 0,
        style: 'currency',
    })
        .format(prize.value)
}

/**
 * Formats a zero-based prize index into a placement label.
 *
 * @param index Zero-based prize index.
 * @returns Ordinal prize label.
 */
function formatPlacementLabel(index: number): string {
    if (index === 0) {
        return '1st'
    }

    if (index === 1) {
        return '2nd'
    }

    if (index === 2) {
        return '3rd'
    }

    return `${index + 1}th`
}

/**
 * Returns the visual tone used for a placement badge.
 *
 * @param index Zero-based prize index.
 * @returns CSS module tone key.
 */
function getPrizeTone(index: number): string {
    if (index === 0) {
        return 'gold'
    }

    if (index === 1) {
        return 'silver'
    }

    if (index === 2) {
        return 'bronze'
    }

    return 'turquoise'
}

const DeadlinesPanel: FC<{ phases: BackendChallengePhase[] }> = (
    props: { phases: BackendChallengePhase[] },
) => (
    <div className={styles.deadlinesPanel}>
        <p className={styles.timezone}>
            Timezone:
            {' '}
            {Intl.DateTimeFormat()
                .resolvedOptions().timeZone}
        </p>
        {props.phases.map(phase => (
            <div className={styles.deadlineItem} key={`${phase.id}-${phase.name}`}>
                <p className={styles.deadlineName}>{phase.name}</p>
                <p className={styles.deadlineRange}>
                    {formatDate(phase.actualStartDate ?? phase.scheduledStartDate)}
                    {' - '}
                    {formatDate(getPhaseEndDate(phase))}
                </p>
            </div>
        ))}
    </div>
)

/**
 * Renders the challenge detail header with actions, deadlines and tabs.
 *
 * @param props Header state and action handlers.
 * @returns Challenge detail header block.
 */
const ChallengeHeader: FC<ChallengeHeaderProps> = (props: ChallengeHeaderProps) => {
    const isDesign = isDesignChallenge(props.challenge)
    const typeName = toTypeName(props.challenge)
    const tagLabels = useMemo(() => Array.from(new Set([
        props.challenge.track.name,
        typeName,
        ...props.challenge.tags,
    ]))
        .filter(Boolean)
        .slice(0, 6), [
        props.challenge.tags,
        props.challenge.track.name,
        typeName,
    ])
    const prizeRows = useMemo(() => props.challengePrizes.map((prize, index) => ({
        label: formatPlacementLabel(index),
        prize,
        tone: getPrizeTone(index),
    })), [props.challengePrizes])

    const sortedPhases = useMemo(() => [...props.challenge.phases]
        .sort((a, b) => {
            const timeA = getPhaseEndDate(a)
                ? new Date(getPhaseEndDate(a) as string)
                    .getTime()
                : 0
            const timeB = getPhaseEndDate(b)
                ? new Date(getPhaseEndDate(b) as string)
                    .getTime()
                : 0

            return timeA - timeB
        }), [props.challenge.phases])

    const registrationPhase = props.challenge.phases.find(phase => (
        phase.name.toLowerCase()
            .includes('registration')
    ))

    const registrationEnded = props.challenge.status === 'COMPLETED'
        || registrationPhase?.isOpen !== true
    const hasSubmissions = props.mySubmissions.length > 0

    const registerButtonDisabled = props.registering
        || registrationEnded
        || props.isLegacyMM
        || props.challenge.status !== 'ACTIVE'
    const unregisterButtonDisabled = props.unregistering
        || registrationEnded
        || hasSubmissions
        || props.isLegacyMM
    const submitButtonDisabled = !props.hasRegistered
        || props.unregistering
        || props.submissionEnded
        || props.isLegacyMM

    const checkpointPrizeSet = props.challenge.prizeSets.find(prizeSet => (
        prizeSet.type.toLowerCase() === 'checkpoint'
    ))

    const checkpointBonus = checkpointPrizeSet?.prizes?.[0] as { type?: string; value?: number } | undefined
    const checkpointBonusText = checkpointBonus?.value
        ? checkpointBonus.type === 'POINT'
            ? `${checkpointBonus.value} pts checkpoint bonus`
            : `$${checkpointBonus.value} checkpoint bonus`
        : undefined

    const nextOpenPhase = sortedPhases.find(phase => phase.isOpen && phase.name !== 'Registration')
    const currentDeadlineValue = props.challenge.timeLeft
        ?? (nextOpenPhase ? formatDate(getPhaseEndDate(nextOpenPhase)) : 'No open phase')
    const registerLabel = props.isLoggedIn
        ? 'Register'
        : 'Login to Register'
    const challengeDetailPath = useMemo(() => {
        const detailPath = generatePath(challengeDetailRouteId, { challengeId: props.challenge.id })

        return `/${`${rootRoute}/${detailPath}`
            .replace(/\/{2,}/g, '/')
            .replace(/^\/+/, '')}`
    }, [props.challenge.id])
    const submitPath = `${challengeDetailPath}/submit`
    const viewSubmissionsPath = `${challengeDetailPath}/my-submissions`
    const handleSubmitLinkClick = useCallback((event: MouseEvent<HTMLAnchorElement>): void => {
        if (submitButtonDisabled) {
            event.preventDefault()
        }
    }, [submitButtonDisabled])
    const handleTabClick = useCallback((event: MouseEvent<HTMLButtonElement>): void => {
        const tab = event.currentTarget.dataset.tab as ChallengeDetailTabId | undefined

        if (tab) {
            props.onTabChange(tab)
        }
    }, [props])

    return (
        <header className={styles.container}>
            <div className={styles.challengeTitleRow}>
                <Link className={styles.backCircle} to={props.challengesUrl} aria-label='Back to Challenges'>
                    <IconOutline.ChevronDownIcon />
                </Link>
                <div>
                    <h1 className={styles.title}>{props.challenge.name}</h1>
                    <div className={styles.tagRow}>
                        {tagLabels.map(tag => (
                            <span className={styles.smallTag} key={tag}>{tag}</span>
                        ))}
                    </div>
                </div>
            </div>

            <div className={styles.keyInformation}>
                <div className={styles.keyTitle}>Key information</div>
                <div className={styles.prizeRow}>
                    <div className={styles.prizes}>
                        {prizeRows.length
                            ? prizeRows.map(row => (
                                <div
                                    className={styles.prize}
                                    key={`${row.label}-${row.prize.type ?? 'USD'}-${row.prize.value}`}
                                >
                                    <span className={classNames(styles.prizeBadge, styles[row.tone])}>
                                        {row.label}
                                    </span>
                                    <strong>{formatPrizeValue(row.prize)}</strong>
                                </div>
                            ))
                            : <span className={styles.noPrizes}>No prizes listed</span>}
                    </div>
                    <div className={styles.challengeActions}>
                        {props.hasRegistered ? (
                            <Button
                                className={styles.outlinePill}
                                disabled={unregisterButtonDisabled}
                                onClick={props.onUnregisterClick}
                                secondary
                                size='lg'
                            >
                                Unregister
                            </Button>
                        ) : (
                            <Button
                                className={styles.primaryPill}
                                disabled={registerButtonDisabled}
                                onClick={props.onRegisterClick}
                                primary
                                size='lg'
                            >
                                {registerLabel}
                            </Button>
                        )}

                        <Link
                            className={classNames(styles.primaryPillLink, submitButtonDisabled && styles.disabled)}
                            onClick={handleSubmitLinkClick}
                            to={submitPath}
                        >
                            <IconOutline.UploadIcon />
                            Submit a solution
                        </Link>

                        {isDesign && props.hasRegistered && hasSubmissions && (
                            <Link className={styles.outlinePillLink} to={viewSubmissionsPath}>
                                View Submissions
                            </Link>
                        )}
                    </div>
                </div>

                {(checkpointBonusText || props.challenge.reliabilityBonus || props.displayWinners.length > 0) && (
                    <p className={styles.bonus}>
                        {checkpointBonusText && (
                            <>
                                <span>Bonus:</span>
                                {' '}
                                {checkpointBonusText}
                            </>
                        )}
                        {props.challenge.reliabilityBonus && (
                            <>
                                {checkpointBonusText ? ' | ' : ''}
                                <span>Reliability Bonus:</span>
                                {' $'}
                                {props.challenge.reliabilityBonus.toFixed(0)}
                            </>
                        )}
                        {props.displayWinners.length > 0 && (
                            <>
                                {(checkpointBonusText || props.challenge.reliabilityBonus) ? ' | ' : ''}
                                <span>Winners announced:</span>
                                {' '}
                                {props.displayWinners.length}
                            </>
                        )}
                    </p>
                )}

                <button className={styles.deadlineBar} onClick={props.onToggleDeadlines} type='button'>
                    <span>
                        Next Deadline:
                        {' '}
                        <strong>{nextOpenPhase?.name ?? 'No open phase'}</strong>
                    </span>
                    <span className={styles.deadlineDivider} />
                    <span>
                        Current Deadline Ends:
                        {' '}
                        <strong>{currentDeadlineValue}</strong>
                    </span>
                    <IconOutline.ChevronDownIcon
                        className={classNames(
                            styles.deadlineIcon,
                            props.showDeadlineDetail && styles.deadlineIconOpen,
                        )}
                    />
                </button>

                {props.showDeadlineDetail && <DeadlinesPanel phases={sortedPhases} />}

                <nav className={styles.challengeTabs} aria-label='Challenge sections'>
                    {props.tabs.map(tab => (
                        <button
                            aria-current={props.activeTab === tab.id ? 'page' : undefined}
                            className={classNames(
                                styles.tabButton,
                                props.activeTab === tab.id && styles.activeTab,
                            )}
                            data-tab={tab.id}
                            key={tab.id}
                            onClick={handleTabClick}
                            type='button'
                        >
                            {tab.title}
                            {tab.badges?.map(badge => (
                                <span className={styles.tabBadge} key={badge.type}>
                                    {badge.count}
                                </span>
                            ))}
                        </button>
                    ))}
                </nav>
            </div>
        </header>
    )
}

export default ChallengeHeader
