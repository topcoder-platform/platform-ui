import { FC, useMemo } from 'react'
import { get } from 'lodash'

import {
    MemberStats,
    SRMStats,
    UserProfile,
    UserStatsDistributionResponse,
    UserStatsHistory,
    useStatsDistribution,
    useStatsHistory,
} from '~/libs/core'

import { DetailedTrackView } from '../DetailedTrackView'
import { DivisionGrid } from '../../DivisionGrid'
import { ChallengesGrid } from '../../ChallengesGrid'
import { ViewMode } from '../DetailedTrackView/DetailedTrackView'

import styles from './SRMView.module.scss'

interface SRMViewProps {
    profile: UserProfile
    trackData: SRMStats | MemberStats
}

const SRMView: FC<SRMViewProps> = props => {
    const statsHistory: UserStatsHistory | undefined = useStatsHistory(props.profile?.handle)

    const trackName: string = (props.trackData as MemberStats).name ?? 'SRM'
    const trackHistory = get(statsHistory, `${props.trackData.path}.${trackName}.history`)

    const ratingDistribution: UserStatsDistributionResponse | undefined = useStatsDistribution({
        filter: `track=${props.trackData.parentTrack}&subTrack=${trackName}`,
    })

    const showDetailsViewBtn = useMemo(() => Boolean(
        (props.trackData as SRMStats)?.division1
        || (props.trackData as SRMStats)?.division2
        || (props.trackData as SRMStats)?.challengeDetails,
    ), [props.trackData])

    return (
        <DetailedTrackView
            trackData={props.trackData}
            trackHistory={trackHistory}
            ratingDistribution={ratingDistribution}
            showDetailsViewBtn={showDetailsViewBtn}
            defaultViewMode={ViewMode.statistics}
            challengesDetailedView={(
                <>
                    <div className={styles.details}>
                        {(props.trackData as SRMStats)?.division1 && (
                            <DivisionGrid divisionData={(props.trackData as SRMStats).division1} number={1} />
                        )}
                        {(props.trackData as SRMStats)?.division2 && (
                            <DivisionGrid divisionData={(props.trackData as SRMStats).division2} number={2} />
                        )}
                        {(props.trackData as SRMStats)?.challengeDetails && (
                            <ChallengesGrid challengesData={(props.trackData as SRMStats).challengeDetails} />
                        )}
                    </div>
                </>
            )}
        />
    )
}

export default SRMView
