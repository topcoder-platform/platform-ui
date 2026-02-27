/* eslint-disable complexity */
import { FC, MouseEvent, useCallback, useMemo } from 'react'
import { generatePath, Link } from 'react-router-dom'
import classNames from 'classnames'
import moment from 'moment'

import {
    Button,
    TabsNavbar,
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

type ChallengeDetailTabId = 'checkpoints' | 'details' | 'registrants' | 'submissions' | 'winners'

interface ChallengeHeaderProps {
    activeTab: ChallengeDetailTabId
    challenge: ChallengeInfo
    challengePrizes: PlacementPrize[]
    challengesUrl: string
    displayWinners: BackendChallengeWinner[]
    forumLink?: string
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
    showForumLink: boolean
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
    const handleTabsChange = useCallback((tab: ChallengeDetailTabId): void => {
        props.onTabChange(tab)
    }, [props.onTabChange])

    return (
        <header className={styles.container}>
            <div className={styles.topRow}>
                <Link className={styles.backLink} to={props.challengesUrl}>
                    <span aria-hidden='true'>&lt;</span>
                    <span>Back to Challenges</span>
                </Link>
                <h1 className={styles.title}>{props.challenge.name}</h1>
            </div>

            <div className={styles.badges}>
                <span className={styles.badge}>{props.challenge.track.name}</span>
                <span className={styles.badge}>{typeName}</span>
            </div>

            <div className={styles.infoRow}>
                {!!props.challengePrizes.length && (
                    <div className={styles.prizes}>
                        <span className={styles.label}>Prizes:</span>
                        <span>
                            {props.challengePrizes.map(prize => (
                                prize.type === 'POINT'
                                    ? `${prize.value.toLocaleString('en-US')} pts`
                                    : new Intl.NumberFormat('en-US', {
                                        currency: 'USD',
                                        maximumFractionDigits: 0,
                                        style: 'currency',
                                    })
                                        .format(prize.value)
                            ))
                                .join(' / ')}
                        </span>
                    </div>
                )}

                {checkpointBonusText && (
                    <div className={styles.bonus}>{checkpointBonusText}</div>
                )}

                {props.challenge.reliabilityBonus && (
                    <div className={styles.bonus}>
                        Reliability Bonus: $
                        {props.challenge.reliabilityBonus.toFixed(0)}
                    </div>
                )}

                {!!props.displayWinners.length && (
                    <div className={styles.meta}>
                        Winners announced:
                        {props.displayWinners.length}
                    </div>
                )}
            </div>

            <div className={styles.actions}>
                {props.hasRegistered ? (
                    <Button
                        disabled={unregisterButtonDisabled}
                        onClick={props.onUnregisterClick}
                        secondary
                    >
                        Unregister
                    </Button>
                ) : (
                    <Button
                        disabled={registerButtonDisabled}
                        onClick={props.onRegisterClick}
                        primary
                    >
                        {registerLabel}
                    </Button>
                )}

                <Link
                    className={classNames(styles.actionLink, submitButtonDisabled && styles.disabled)}
                    onClick={handleSubmitLinkClick}
                    to={submitPath}
                >
                    Submit a solution
                </Link>

                {isDesign && props.hasRegistered && hasSubmissions && (
                    <Link className={styles.actionLink} to={viewSubmissionsPath}>
                        View Submissions
                    </Link>
                )}
            </div>

            <div className={styles.deadlineBar}>
                <div>
                    <p className={styles.deadlineTitle}>Current Phase</p>
                    <p className={styles.deadlineValue}>
                        {nextOpenPhase
                            ? `${nextOpenPhase.name} ends ${formatDate(getPhaseEndDate(nextOpenPhase))}`
                            : 'No open phase'}
                    </p>
                </div>
                <button className={styles.toggleDeadlines} onClick={props.onToggleDeadlines} type='button'>
                    {props.showDeadlineDetail ? 'Hide deadlines' : 'Show deadlines'}
                </button>
            </div>

            {props.showDeadlineDetail && <DeadlinesPanel phases={sortedPhases} />}

            <div className={styles.tabsRow}>
                <TabsNavbar
                    defaultActive={props.activeTab}
                    onChange={handleTabsChange}
                    tabs={props.tabs}
                />

                {props.showForumLink && props.forumLink && (
                    <a
                        className={styles.forumLink}
                        href={props.forumLink}
                        rel='noreferrer'
                        target='_blank'
                    >
                        Challenge Forum
                    </a>
                )}
            </div>
        </header>
    )
}

export default ChallengeHeader
