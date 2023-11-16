import { FC, PropsWithChildren } from 'react'
import { To } from 'react-router-dom'

import { StatsNavHeader } from '../StatsNavHeader'
import { StatsSummaryBlock } from '../StatsSummaryBlock'
import { MemberStatsTrack } from '../../../hooks/useFetchActiveTracks'

import styles from './StatsDetailsLayout.module.scss'

interface StatsDetailsLayoutProps extends PropsWithChildren {
    title: string
    prevTitle: string
    backAction: To
    closeAction: To
    trackData: MemberStatsTrack
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
                trackTitle={props.title}
                challenges={props.trackData.challenges}
                wins={props.trackData.wins}
                submissions={props.trackData.submissions}
                ranking={props.trackData.ranking}
            />
        </div>
        {props.children}
    </div>
)

export default StatsDetailsLayout
