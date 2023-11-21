import { FC, ReactElement } from 'react'
import { Link, useParams } from 'react-router-dom'

import { MemberStats, UserProfile } from '~/libs/core'

import { useFetchTrackData } from '../../../hooks'
import { getUserProfileRoute, getUserProfileStatsRoute } from '../../../profiles.routes'
import { StatsDetailsLayout } from '../../../components/tc-achievements/StatsDetailsLayout'
import { SubTrackSummaryCard } from '../../../components/tc-achievements/SubTrackSummaryCard'

import styles from './TrackView.module.scss'

interface TrackViewProps {
    profile: UserProfile
    renderDefault: () => ReactElement
}

const TrackView: FC<TrackViewProps> = props => {
    const params = useParams()
    const trackData = useFetchTrackData(props.profile.handle, params.trackType)

    return !trackData ? props.renderDefault() : (
        <div className={styles.wrap}>
            <StatsDetailsLayout
                prevTitle='Member Stats'
                title={trackData.name}
                backAction={getUserProfileRoute(props.profile.handle)}
                closeAction={getUserProfileRoute(props.profile.handle)}
                trackData={trackData}
            >
                <div className={styles.cardsWrap}>
                    {trackData.subTracks.map((subTrack: MemberStats) => (
                        <Link
                            to={getUserProfileStatsRoute(props.profile.handle, trackData.name, subTrack.name)}
                            key={subTrack.name}
                        >
                            <SubTrackSummaryCard
                                key={subTrack.name}
                                title={subTrack.name}
                                wins={subTrack.wins}
                                submissions={subTrack.submissions?.submissions}
                                challenges={subTrack.challenges}
                            />
                        </Link>
                    ))}
                </div>
            </StatsDetailsLayout>
        </div>
    )
}

export default TrackView
