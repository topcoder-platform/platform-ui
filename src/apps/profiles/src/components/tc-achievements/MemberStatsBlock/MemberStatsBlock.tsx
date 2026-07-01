import { Dispatch, FC, SetStateAction, useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'

import {
    getRatingColor,
    MemberStats,
    useMemberStats,
    UserChallengePointsSummary,
    UserProfile,
    UserStats,
    UserStatsHistory,
    useStatsHistory,
} from '~/libs/core'
import { IconOutline } from '~/libs/ui'

import { getActiveTracks, getMemberChallengePoints, MemberStatsTrack } from '../../../hooks'
import { formatPlural, WinnerIcon } from '../../../lib'
import { MemberProfileContextValue, useMemberProfileContext } from '../../../member-profile/MemberProfile.context'

import MemberChallengePointsModal from './MemberChallengePointsModal'
import styles from './MemberStatsBlock.module.scss'

interface MemberStatsBlockProps {
    profile: UserProfile
}

interface MemberChallengePointsBarProps {
    memberStats?: UserStats
    profile: UserProfile
}

interface TrackDisplayStats {
    indicator?: 'rating' | 'winner'
    label: string
    value: number
}

interface ChallengePointsBarProps {
    canViewBreakdown: boolean
    challengeCount?: number
    points: number
    onOpenBreakdown: () => void
}

interface TrackListItemProps {
    getTrackRoute: (trackName: string, subTracks?: MemberStats[]) => string
    track: MemberStatsTrack
}

const trackDisplayOrder = [
    'AI Engineering',
    'Development',
    'Design',
    'Testing',
    'Data Science',
    'Competitive Programming',
]

const numberFormatter = new Intl.NumberFormat('en-US')

/**
 * Formats profile stats numbers with the comma grouping used in the profile cards.
 *
 * @param {number} value - The stat value to format.
 * @returns {string} The locale-formatted stat value.
 */
const formatStatValue = (value: number): string => numberFormatter.format(value)

/**
 * Returns the stat value, label, and icon treatment for a member stats track.
 *
 * @param {MemberStatsTrack} track - Aggregated stats for a Topcoder track.
 * @returns {TrackDisplayStats} Display metadata for the compact member stats card.
 */
const getTrackDisplayStats = (track: MemberStatsTrack): TrackDisplayStats => {
    if (track.rating) {
        return {
            indicator: 'rating',
            label: 'Rating',
            value: track.rating,
        }
    }

    if (track.wins > 0) {
        return {
            indicator: 'winner',
            label: formatPlural(track.wins, 'Win'),
            value: track.wins,
        }
    }

    const submissions = track.submissions ?? 0
    if (submissions > 0) {
        return {
            label: formatPlural(submissions, 'Submission'),
            value: submissions,
        }
    }

    return {
        label: formatPlural(track.challenges ?? 0, 'Challenge'),
        value: track.challenges ?? 0,
    }
}

/**
 * Sorts tracks into the Figma member-stats card order while keeping unknown tracks visible.
 *
 * @param {MemberStatsTrack[]} tracks - Aggregated active tracks.
 * @returns {MemberStatsTrack[]} Tracks in display order.
 */
const sortTracksForDisplay = (tracks: MemberStatsTrack[]): MemberStatsTrack[] => (
    [...tracks].sort((trackA, trackB) => {
        const trackAIndex = trackDisplayOrder.indexOf(trackA.name)
        const trackBIndex = trackDisplayOrder.indexOf(trackB.name)

        return (trackAIndex === -1 ? Number.MAX_SAFE_INTEGER : trackAIndex)
            - (trackBIndex === -1 ? Number.MAX_SAFE_INTEGER : trackBIndex)
    })
)

/**
 * Renders the profile challenge-points summary and optional breakdown trigger.
 *
 * @param {ChallengePointsBarProps} props - Challenge point display data and action.
 * @returns {JSX.Element} The challenge-points summary bar.
 */
const ChallengePointsBar: FC<ChallengePointsBarProps> = props => (
    <div className={styles.challengePointsBar}>
        <span className={styles.challengePointsLabel}>
            Challenge Points:
        </span>
        <span className={styles.challengePointsValue}>
            {formatStatValue(props.points)}
        </span>
        {props.challengeCount !== undefined && (
            <span className={styles.challengePointsMeta}>
                from
                {' '}
                {formatStatValue(props.challengeCount)}
                {' '}
                {formatPlural(props.challengeCount, 'challenge')}
            </span>
        )}
        {props.canViewBreakdown && (
            <button
                className={styles.challengePointsLink}
                onClick={props.onOpenBreakdown}
                type='button'
            >
                View breakdown
                <IconOutline.ChevronRightIcon className='icon-lg' />
            </button>
        )}
    </div>
)

/**
 * Renders the standalone challenge-points row and its optional breakdown modal.
 *
 * @param {MemberChallengePointsBarProps} props - Profile data plus already-fetched member stats fallback data.
 * @returns {JSX.Element} The challenge-points row, or an empty fragment when no points exist.
 */
export const MemberChallengePointsBar: FC<MemberChallengePointsBarProps> = props => {
    const [isPointsModalOpen, setIsPointsModalOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const profileChallengePoints: UserChallengePointsSummary | undefined = (
        (props.profile.challengePoints?.total ?? 0) > 0
            ? props.profile.challengePoints
            : undefined
    )
    const statsChallengePoints = useMemo(() => getMemberChallengePoints(props.memberStats), [props.memberStats])
    const challengePoints = profileChallengePoints?.total
        ?? ((statsChallengePoints ?? 0) > 0 ? statsChallengePoints : undefined)
    const challengePointsChallenges = profileChallengePoints?.challenges ?? props.memberStats?.challenges
    const canViewChallengePointsBreakdown = (profileChallengePoints?.details?.length ?? 0) > 0

    function handleOpenPointsModal(): void {
        setIsPointsModalOpen(true)
    }

    function handleClosePointsModal(): void {
        setIsPointsModalOpen(false)
    }

    return challengePoints === undefined ? <></> : (
        <div className={styles.challengePointsStandalone}>
            <ChallengePointsBar
                canViewBreakdown={canViewChallengePointsBreakdown}
                challengeCount={challengePointsChallenges}
                points={challengePoints}
                onOpenBreakdown={handleOpenPointsModal}
            />
            {isPointsModalOpen && profileChallengePoints && (
                <MemberChallengePointsModal
                    challengePoints={profileChallengePoints}
                    onClose={handleClosePointsModal}
                />
            )}
        </div>
    )
}

/**
 * Renders one linked member-stats track row.
 *
 * @param {TrackListItemProps} props - Track data and route resolver.
 * @returns {JSX.Element} The track list item.
 */
const TrackListItem: FC<TrackListItemProps> = props => {
    const displayStats = getTrackDisplayStats(props.track)

    return (
        <li>
            <Link
                to={props.getTrackRoute(props.track.name, props.track.subTracks)}
                className={styles.trackListItem}
            >
                <span className={styles.trackName}>{props.track.name}</span>
                <div className={styles.trackDetails}>
                    {displayStats.indicator === 'winner' && (
                        <WinnerIcon className={classNames('icon-xxl', styles.winnerIcon)} />
                    )}
                    {displayStats.indicator === 'rating' && (
                        <span
                            className={styles.icon}
                            style={{ color: getRatingColor(displayStats.value) }}
                        />
                    )}
                    <span className={styles.trackStats}>
                        <span className={styles.count}>
                            {formatStatValue(displayStats.value)}
                        </span>
                        <span className={styles.label}>
                            {displayStats.label}
                        </span>
                    </span>
                    <IconOutline.ChevronRightIcon
                        className={classNames('icon-lg', styles.rightArrowIcon)}
                    />
                </div>
            </Link>
        </li>
    )
}

const MemberStatsBlock: FC<MemberStatsBlockProps> = props => {
    const { statsRoute }: MemberProfileContextValue = useMemberProfileContext()

    const memberStats: UserStats | undefined = useMemberStats(props.profile.handle)
    const statsHistory: UserStatsHistory | undefined = useStatsHistory(props.profile.handle)
    const activeTracks = useMemo(() => getActiveTracks(memberStats, statsHistory), [memberStats, statsHistory])
    const displayTracks = useMemo(() => sortTracksForDisplay(activeTracks), [activeTracks])

    const getTrackRoute = useCallback((trackName: string, subTracks?: MemberStats[]): string => {
        const subTrackName = subTracks?.length === 1 ? subTracks[0].name : ''
        return statsRoute(props.profile.handle, trackName, subTrackName)
    }, [props.profile.handle, statsRoute])

    return displayTracks.length === 0 ? <></> : (
        <div className={styles.containerWrap}>
            <div className={styles.container}>
                <div className={styles.innerWrapper}>
                    <p className={styles.sectionTitle}>
                        <span className='body-large-bold'>
                            Member Stats
                        </span>
                    </p>
                    <ul className={styles.statsList}>
                        {displayTracks.map(track => (
                            <TrackListItem
                                getTrackRoute={getTrackRoute}
                                key={track.name}
                                track={track}
                            />
                        ))}
                    </ul>
                    <p className={styles.footerNote}>
                        <span className='body-main'>
                            Topcoder challenges are competitive events where community members collaborate
                            on smaller tasks to complete a project,
                            striving to showcase their skills and outperform others.
                        </span>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default MemberStatsBlock
