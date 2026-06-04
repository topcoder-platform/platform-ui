import { FC, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'

import { getRatingColor, MemberStats, useMemberStats, UserProfile, UserStats } from '~/libs/core'
import { IconOutline } from '~/libs/ui'

import { getActiveTracks, getMemberChallengePoints, MemberStatsTrack } from '../../../hooks'
import { formatPlural, WinnerIcon } from '../../../lib'
import { MemberProfileContextValue, useMemberProfileContext } from '../../../member-profile/MemberProfile.context'

import styles from './MemberStatsBlock.module.scss'

interface MemberStatsBlockProps {
    profile: UserProfile
}

interface TrackDisplayStats {
    indicator?: 'rating' | 'winner'
    label: string
    value: number
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

const MemberStatsBlock: FC<MemberStatsBlockProps> = props => {
    const { statsRoute }: MemberProfileContextValue = useMemberProfileContext()

    const memberStats: UserStats | undefined = useMemberStats(props.profile.handle)
    const activeTracks = useMemo(() => getActiveTracks(memberStats), [memberStats])
    const displayTracks = useMemo(() => sortTracksForDisplay(activeTracks), [activeTracks])
    const challengePoints = useMemo(() => getMemberChallengePoints(memberStats), [memberStats])

    const getTrackRoute = useCallback((trackName: string, subTracks?: MemberStats[]): string => {
        const subTrackName = subTracks?.length === 1 ? subTracks[0].name : ''
        return statsRoute(props.profile.handle, trackName, subTrackName)
    }, [props.profile.handle, statsRoute])

    return displayTracks?.length === 0 ? <></> : (
        <div className={styles.containerWrap}>
            {challengePoints !== undefined && (
                <div className={styles.challengePointsBar}>
                    <span className={styles.challengePointsLabel}>
                        Challenge Points
                    </span>
                    <span className={styles.challengePointsValue}>
                        {formatStatValue(challengePoints)}
                    </span>
                    {memberStats?.challenges !== undefined && (
                        <span className={styles.challengePointsMeta}>
                            from
                            {' '}
                            {formatStatValue(memberStats.challenges)}
                            {' '}
                            {formatPlural(memberStats.challenges, 'challenge')}
                        </span>
                    )}
                    <span className={styles.challengePointsLink}>
                        View breakdown
                        <IconOutline.ChevronRightIcon className='icon-sm' />
                    </span>
                </div>
            )}
            <div className={styles.container}>
                <div className={styles.innerWrapper}>
                    <p className={styles.sectionTitle}>
                        <span className='body-large-bold'>
                            Member Stats
                        </span>
                    </p>
                    <ul className={styles.statsList}>
                        {displayTracks.map(track => (
                            <li key={track.name}>
                                <Link
                                    to={getTrackRoute(track.name, track.subTracks)}
                                    className={styles.trackListItem}
                                >
                                    <span className={styles.trackName}>{track.name}</span>
                                    <div className={styles.trackDetails}>
                                        {getTrackDisplayStats(track).indicator === 'winner' && (
                                            <WinnerIcon className={classNames('icon-xxl', styles.winnerIcon)} />
                                        )}
                                        {getTrackDisplayStats(track).indicator === 'rating' && (
                                            <span
                                                className={styles.icon}
                                                style={{ color: getRatingColor(getTrackDisplayStats(track).value) }}
                                            />
                                        )}
                                        <span className={styles.trackStats}>
                                            <span className={styles.count}>
                                                {formatStatValue(getTrackDisplayStats(track).value)}
                                            </span>
                                            <span className={styles.label}>
                                                {getTrackDisplayStats(track).label}
                                            </span>
                                        </span>
                                        <IconOutline.ChevronRightIcon
                                            className={classNames('icon-lg', styles.rightArrowIcon)}
                                        />
                                    </div>
                                </Link>
                            </li>
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
