/* eslint-disable complexity */
import { Dispatch, FC, SetStateAction, useState } from 'react'
import { get } from 'lodash'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

import { BaseModal } from '~/libs/ui'
import {
    MemberStats,
    ratingToCSScolor,
    UserProfile,
    UserStatsDistributionResponse,
    UserStatsHistory,
    useStatsDistribution,
    useStatsHistory,
} from '~/libs/core'

import { numberToFixed } from '../../lib'
import { useRatingDistroOptions, useRatingHistoryOptions } from '../../hooks'

import styles from './GenericSubtrackDetailsModal.module.scss'

type GenericViewTypes = 'CHALLENGES DETAILS' | 'STATISTICS'

interface GenericSubtrackDetailsModalProps {
    onClose: () => void
    genericStats: MemberStats | undefined
    chartTitle: string | undefined
    profile: UserProfile | undefined
    subTrack: string
    title: string
    track: string
}

const GenericSubtrackDetailsModal: FC<GenericSubtrackDetailsModalProps> = (props: GenericSubtrackDetailsModalProps) => {
    // TODO: Enable this when we have challenges details data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [viewType]: [GenericViewTypes, Dispatch<SetStateAction<GenericViewTypes>>]
        = useState<GenericViewTypes>('STATISTICS')

    const statsHistory: UserStatsHistory | undefined = useStatsHistory(props.profile?.handle)

    const ratingHistoryOptions: Highcharts.Options | undefined
        = useRatingHistoryOptions(
            get(statsHistory, props.track)?.subTracks?.find(
                (subTrack: any) => subTrack.name === props.subTrack,
            )?.history,
            props.chartTitle || '',
        )

    const memberStatsDist: UserStatsDistributionResponse | undefined = useStatsDistribution({
        filter: `track=${props.track}&subTrack=${props.subTrack}`,
    })

    const ratingDistributionOptions: Highcharts.Options | undefined
        = useRatingDistroOptions(memberStatsDist?.distribution || {}, props.genericStats?.rank?.rating)

    return (
        <BaseModal
            onClose={props.onClose}
            open
            size='body'
            title={props.title}
        >

            <div className={styles.container}>
                <div className='member-stat-header'>
                    <div>
                        <span
                            className='member-stat-value'
                            style={ratingToCSScolor(props.genericStats?.rank.rating || 0)}
                        >
                            {props.genericStats?.rank.rating}
                        </span>
                        Rating
                    </div>
                    <div>
                        <span className='member-stat-value'>{props.genericStats?.wins}</span>
                        Wins
                    </div>
                    <div>
                        <span className='member-stat-value'>{props.genericStats?.challenges}</span>
                        Challenges
                    </div>
                    <div>
                        <span className='member-stat-value'>
                            {numberToFixed(props.genericStats?.rank?.overallPercentile || 0)}
                            %
                        </span>
                        Percentile
                    </div>
                    <div>
                        <span className='member-stat-value'>
                            {numberToFixed(props.genericStats?.screeningSuccessRate || 0)}
                            %
                        </span>
                        Screening Success Rate
                    </div>
                    {/* <div>
                        <span className='member-stat-value'>
                            {numberToFixed(props.genericStats?.avgPlacement || 0)}
                        </span>
                        Average Placement
                    </div> */}
                </div>
                <div className={styles.content}>
                    <div className={styles.contentHeader}>
                        <h4>{viewType}</h4>
                    </div>

                    <div className={styles.contentBody}>
                        {
                            viewType === 'CHALLENGES DETAILS' && (
                                <div />
                            )

                        }
                        {
                            viewType === 'STATISTICS' && (
                                <div>
                                    {
                                        ratingHistoryOptions && (
                                            <HighchartsReact
                                                highcharts={Highcharts}
                                                options={ratingHistoryOptions}
                                            />
                                        )
                                    }
                                    {
                                        ratingDistributionOptions && (
                                            <HighchartsReact
                                                highcharts={Highcharts}
                                                options={ratingDistributionOptions}
                                            />
                                        )
                                    }
                                </div>
                            )

                        }
                    </div>
                </div>
            </div>
        </BaseModal>
    )
}

export default GenericSubtrackDetailsModal
