/* eslint-disable complexity */
import { Dispatch, FC, SetStateAction, useMemo, useState } from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

import { BaseModal, LoadingSpinner } from '~/libs/ui'
import {
    MemberStats,
    ratingToCSScolor,
    StatsHistory,
    UserProfile,
    UserStatsDistributionResponse,
    UserStatsHistory,
    useStatsDistribution,
    useStatsHistory,
} from '~/libs/core'

import { useRatingDistroOptions } from '../../hooks'

import { RATING_CHART_CONFIG } from './chart-configs'
import styles from './MMDetailsModal.module.scss'

type SRMViewTypes = 'STATISTICS' | 'MATCH DETAILS'

interface MMDetailsModalProps {
    onClose: () => void
    MMStats: MemberStats | undefined
    profile: UserProfile | undefined
}

const MMDetailsModal: FC<MMDetailsModalProps> = (props: MMDetailsModalProps) => {
    const [viewType, setviewType]: [SRMViewTypes, Dispatch<SetStateAction<SRMViewTypes>>]
        = useState<SRMViewTypes>('STATISTICS')

    const statsHistory: UserStatsHistory | undefined = useStatsHistory(props.profile?.handle)

    const ratingHistoryOptions: Highcharts.Options | undefined = useMemo(() => {
        const mmHistory: Array<StatsHistory> = statsHistory?.DATA_SCIENCE?.MARATHON_MATCH?.history || []
        const options: Highcharts.Options = RATING_CHART_CONFIG

        if (!mmHistory.length) return undefined

        options.series = [{
            data: mmHistory.sort((a, b) => b.date - a.date)
                .map((srm: StatsHistory) => ({ name: srm.challengeName, x: srm.date, y: srm.rating })),
            name: 'Marathon Match Rating',
            type: 'spline',
        }]

        return options
    }, [statsHistory])

    const memberStatsDist: UserStatsDistributionResponse | undefined = useStatsDistribution({
        filter: 'track=DATA_SCIENCE&subTrack=MARATHON_MATCH',
    })

    const ratingDistributionOptions: Highcharts.Options | undefined
        = useRatingDistroOptions(memberStatsDist?.distribution || {}, props.MMStats?.rank.rating)

    // TODO: Enable this when we have challenges details data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function toggleViewType(newViewType: SRMViewTypes): void {
        setviewType(newViewType)
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open
            size='body'
            title='MARATHON MATCH'
        >
            <LoadingSpinner hide={!!statsHistory && !!memberStatsDist} />

            {!!statsHistory && !!memberStatsDist && (
                <div className={styles.container}>
                    <div className='member-stat-header'>
                        <div>
                            <span
                                className='member-stat-value'
                                style={ratingToCSScolor(props.MMStats?.rank.rating || 0)}
                            >
                                {props.MMStats?.rank.rating}
                            </span>
                            Rating
                        </div>
                        <div>
                            <span className='member-stat-value'>{props.MMStats?.rank.rank}</span>
                            Rank
                        </div>
                        <div>
                            <span className='member-stat-value'>
                                {props.MMStats?.rank.percentile}
                                %
                            </span>
                            Percentile
                        </div>
                        <div>
                            <span className='member-stat-value'>{props.MMStats?.wins}</span>
                            Wins
                        </div>
                    </div>

                    <div className={styles.content}>
                        <div className={styles.contentHeader}>
                            <h4>{viewType}</h4>
                            {/* TODO: Enable this when we have challenges details data */}
                            {/* <div className={styles.contentHeaderActions}>
                                <Button
                                    primary
                                    onClick={bind(
                                        toggleViewType,
                                        this,
                                        viewType !== 'MATCH DETAILS' ? 'MATCH DETAILS' : 'STATISTICS',
                                    )}
                                >
                                    See
                                    {' '}
                                    {viewType !== 'MATCH DETAILS' ? 'MATCH DETAILS' : 'STATISTICS'}
                                </Button>
                            </div> */}
                        </div>

                        <div className={styles.contentBody}>
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
                            {
                                viewType === 'MATCH DETAILS' && (
                                    <div />
                                )

                            }
                        </div>
                    </div>
                </div>
            )}
        </BaseModal>
    )
}

export default MMDetailsModal
