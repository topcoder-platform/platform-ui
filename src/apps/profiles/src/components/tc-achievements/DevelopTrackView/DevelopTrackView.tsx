import { FC, useMemo } from 'react'
import { isEmpty } from 'lodash'

import {
    MemberStats,
    UserProfile,
    UserStatsDistributionResponse,
    useStatsDistribution,
} from '~/libs/core'

import { DetailedTrackView } from '../DetailedTrackView'
import { ChallengeHistoryView } from '../ChallengeHistoryView'
import { useTrackHistory } from '../../../hooks'

interface DevelopTrackViewProps {
    profile: UserProfile
    trackData: MemberStats
}

const DevelopTrackView: FC<DevelopTrackViewProps> = props => {
    const trackName: string = (props.trackData as MemberStats).name ?? 'SRM'
    const trackHistory = useTrackHistory(props.profile?.handle, props.trackData)

    const ratingDistribution: UserStatsDistributionResponse | undefined = useStatsDistribution({
        subTrack: trackName,
        track: props.trackData.parentTrack,
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
