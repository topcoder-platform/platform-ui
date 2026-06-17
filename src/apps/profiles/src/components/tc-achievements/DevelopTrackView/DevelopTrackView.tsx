import { FC, useMemo } from 'react'
import { isEmpty } from 'lodash'

import {
    MemberStats,
    StatsHistory,
    UserStatsDistributionResponse,
    useStatsDistribution,
} from '~/libs/core'

import { DetailedTrackView } from '../DetailedTrackView'
import { ChallengeHistoryView } from '../ChallengeHistoryView'

interface DevelopTrackViewProps {
    trackData: MemberStats
    trackHistory: StatsHistory[]
}

const DevelopTrackView: FC<DevelopTrackViewProps> = props => {
    const trackName: string = (props.trackData as MemberStats).name ?? 'SRM'
    const isDesignTrack = useMemo(() => props.trackData.parentTrack === 'DESIGN', [props.trackData.parentTrack])
    const isFirst2FinishTrack = useMemo(() => [
        'FIRST_2_FINISH',
        'First2Finish',
        'DESIGN_FIRST_2_FINISH',
    ].includes(trackName), [trackName])
    const statsDistributionTrack = props.trackData.statsDistributionTrack ?? props.trackData.parentTrack
    const statsDistributionSubTrack = props.trackData.statsDistributionSubTrack ?? trackName

    const ratingDistribution: UserStatsDistributionResponse | undefined = useStatsDistribution(
        isDesignTrack ? undefined : {
            subTrack: statsDistributionSubTrack,
            track: statsDistributionTrack,
        },
    )

    const showDetailsViewBtn = useMemo(() => (
        !isDesignTrack
        && !isFirst2FinishTrack
        && (
            (!!ratingDistribution && !isEmpty(ratingDistribution))
            || (!!props.trackHistory && !isEmpty(props.trackHistory))
        )
    ), [isDesignTrack, isFirst2FinishTrack, props.trackHistory, ratingDistribution])

    return (
        <DetailedTrackView
            trackData={props.trackData}
            trackHistory={props.trackHistory}
            ratingDistribution={ratingDistribution}
            showDetailsViewBtn={showDetailsViewBtn}
            challengesDetailedView={(
                <ChallengeHistoryView trackHistory={props.trackHistory} />
            )}
        />
    )
}

export default DevelopTrackView
