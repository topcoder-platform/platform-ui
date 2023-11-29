import { FC, ReactElement, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { orderBy } from 'lodash'

import { MemberStats, UserProfile } from '~/libs/core'

import { useFetchTrackData } from '../../../hooks'
import { StatsDetailsLayout } from '../../../components/tc-achievements/StatsDetailsLayout'
import { SubTrackSummaryCard } from '../../../components/tc-achievements/SubTrackSummaryCard'
import { MemberProfileContextValue, useMemberProfileContext } from '../../MemberProfile.context'

import styles from './TrackView.module.scss'

interface TrackViewProps {
    profile: UserProfile
    renderDefault: () => ReactElement
}

const TrackView: FC<TrackViewProps> = props => {
    const { statsRoute }: MemberProfileContextValue = useMemberProfileContext()
    const params = useParams()
    const trackData = useFetchTrackData(props.profile.handle, params.trackType)

    const subTracks: MemberStats[] = useMemo(() => orderBy(
        trackData?.subTracks,
        ['wins', 'submissions.submissions', 'challenges'],
        ['desc', 'desc', 'desc'],
    ), [trackData?.subTracks])

    return !trackData ? props.renderDefault() : (
        <div className={styles.wrap}>
            <StatsDetailsLayout
                prevTitle='Member Stats'
                title={trackData.name}
                backAction={statsRoute(props.profile.handle)}
                closeAction={statsRoute(props.profile.handle)}
                trackData={trackData}
            >
                <div className={styles.cardsWrap}>
                    <div className={styles.cardsInner}>
                        {subTracks.map((subTrack: MemberStats) => (
                            <Link
                                to={statsRoute(props.profile.handle, trackData.name, subTrack.name)}
                                key={subTrack.name}
                            >
                                <SubTrackSummaryCard
                                    key={subTrack.name}
                                    title={subTrack.name}
                                    wins={subTrack.wins}
                                    submissions={subTrack.submissions?.submissions ?? subTrack.submissions ?? 0}
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
