import { FC, useMemo } from 'react'
import { find, get, isEmpty } from 'lodash'

import {
    MemberStats,
    UserProfile,
    UserStatsDistributionResponse,
    UserStatsHistory,
    useStatsDistribution,
    useStatsHistory,
} from '~/libs/core'

import { DetailedTrackView } from '../DetailedTrackView'
import { ChallengeHistoryView } from '../ChallengeHistoryView'

interface DevelopTrackViewProps {
    profile: UserProfile
    trackData: MemberStats
}

const DevelopTrackView: FC<DevelopTrackViewProps> = props => {
    const statsHistory: UserStatsHistory | undefined = useStatsHistory(props.profile?.handle)

    const trackName: string = (props.trackData as MemberStats).name ?? 'SRM'
    const trackHistory = get(find(get(statsHistory, `${props.trackData.path}`), { name: trackName }), 'history')

    const ratingDistribution: UserStatsDistributionResponse | undefined = useStatsDistribution({
        filter: `track=${props.trackData.parentTrack}&subTrack=${trackName}`,
    })

    const showDetailsViewBtn = useMemo(() => (
        (!!ratingDistribution && !isEmpty(ratingDistribution))
        || (!!trackHistory && !isEmpty(trackHistory))
    ), [ratingDistribution, trackHistory])

    return (
        <DetailedTrackView
            trackData={props.trackData}
            trackHistory={trackHistory}
            ratingDistribution={ratingDistribution}
            showDetailsViewBtn={showDetailsViewBtn}
            challengesDetailedView={(
                <ChallengeHistoryView profile={props.profile} trackData={props.trackData} />
            )}
        />
    )
}

export default DevelopTrackView
