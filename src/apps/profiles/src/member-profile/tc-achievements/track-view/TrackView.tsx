import { FC, ReactElement, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { orderBy, sumBy } from 'lodash'

import { MemberStats, UserProfile, UserStatsHistory, useStatsHistory } from '~/libs/core'

import {
    getSubTrackSummaryStats,
    getTrackHistoryFromStats,
    SubTrackSummaryStats,
    useFetchTrackData,
} from '../../../hooks'
import { StatsDetailsLayout } from '../../../components/tc-achievements/StatsDetailsLayout'
import { SubTrackSummaryCard } from '../../../components/tc-achievements/SubTrackSummaryCard'
import { MemberProfileContextValue, useMemberProfileContext } from '../../MemberProfile.context'

import styles from './TrackView.module.scss'

interface TrackViewProps {
    profile: UserProfile
    renderDefault: () => ReactElement
}

type SubTrackDisplayStats = [MemberStats, SubTrackSummaryStats]

const TrackView: FC<TrackViewProps> = props => {
    const { statsRoute }: MemberProfileContextValue = useMemberProfileContext()
    const params = useParams()
    const trackData = useFetchTrackData(props.profile.handle, params.trackType)
    const statsHistory: UserStatsHistory | undefined = useStatsHistory(props.profile.handle)

    const subTrackStats = useMemo<SubTrackDisplayStats[]>(() => (
        trackData?.subTracks.map(subTrack => {
            const trackHistory = getTrackHistoryFromStats(statsHistory, subTrack)

            return [
                subTrack,
                getSubTrackSummaryStats(subTrack, trackHistory),
            ] as SubTrackDisplayStats
        }) ?? []
    ), [statsHistory, trackData?.subTracks])
    const subTracks = useMemo(() => orderBy(
        subTrackStats,
        [
            subTrack => subTrack[1].wins,
            subTrack => subTrack[1].submissions,
            subTrack => subTrack[0].challenges,
        ],
        ['desc', 'desc', 'desc'],
    ), [subTrackStats])
    const displayTrackData = useMemo(() => (trackData ? {
        ...trackData,
        submissions: sumBy(subTrackStats, subTrack => subTrack[1].submissions),
        wins: sumBy(subTrackStats, subTrack => subTrack[1].wins),
    } : undefined), [subTrackStats, trackData])

    return !displayTrackData ? props.renderDefault() : (
        <div className={styles.wrap}>
            <StatsDetailsLayout
                prevTitle='Member Stats'
                title={displayTrackData.name}
                backAction={statsRoute(props.profile.handle)}
                closeAction={statsRoute(props.profile.handle)}
                trackData={displayTrackData}
            >
                <div className={styles.cardsWrap}>
                    <div className={styles.cardsInner}>
                        {subTracks.map(([subTrack, stats]: SubTrackDisplayStats) => (
                            <Link
                                to={statsRoute(props.profile.handle, displayTrackData.name, subTrack.name)}
                                key={subTrack.name}
                            >
                                <SubTrackSummaryCard
                                    key={subTrack.name}
                                    title={subTrack.name}
                                    wins={stats.wins}
                                    submissions={stats.submissions}
                                />
                            </Link>
                        ))}
                    </div>
                </div>
            </StatsDetailsLayout>
        </div>
    )
}

export default TrackView
