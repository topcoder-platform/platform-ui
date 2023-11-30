import { FC, PropsWithChildren } from 'react'
import { To } from 'react-router-dom'

import { MemberStats } from '~/libs/core'

import { StatsNavHeader } from '../StatsNavHeader'
import { StatsSummaryBlock } from '../StatsSummaryBlock'
import { MemberStatsTrack } from '../../../hooks/useFetchActiveTracks'

import styles from './StatsDetailsLayout.module.scss'

interface StatsDetailsLayoutProps extends PropsWithChildren {
    title: string
    prevTitle: string
    backAction: To
    closeAction: To
    trackData: MemberStatsTrack | MemberStats
}

const StatsDetailsLayout: FC<StatsDetailsLayoutProps> = props => (
    <div className={styles.wrap}>
        <StatsNavHeader
            backLabel={props.prevTitle}
            backAction={props.backAction}
            closeAction={props.closeAction}
        />
        <div className={styles.headline}>
            {props.title}
        </div>
        <hr />
        <div className={styles.summaryBlock}>
            <StatsSummaryBlock
                trackId={(props.trackData as MemberStats).id}
                trackTitle={props.title}
                challenges={props.trackData.challenges}
                wins={props.trackData.wins}
                submissions={(props.trackData as MemberStats).submissions?.submissions ?? props.trackData.submissions}
                ranking={(props.trackData as MemberStats).rank?.rank}
                rating={(props.trackData as MemberStats).rank?.rating ?? (props.trackData as MemberStatsTrack).rating}
                volatility={(props.trackData as MemberStats).rank?.volatility}
                screeningSuccessRate={(props.trackData as MemberStats).screeningSuccessRate}
                submissionRate={(props.trackData as MemberStats).submissionRate}
                percentile={(
                    (props.trackData as MemberStats).rank?.overallPercentile
                    ?? (props.trackData as MemberStats).rank?.percentile
                )}
            />
        </div>
        {props.children}
    </div>
)

export default StatsDetailsLayout
