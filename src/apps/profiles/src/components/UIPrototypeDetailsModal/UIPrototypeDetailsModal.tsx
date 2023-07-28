/* eslint-disable complexity */
import { Dispatch, FC, SetStateAction, useMemo, useState } from 'react'
import { isEmpty, keys } from 'lodash'
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

import { numberToFixed } from '../../lib'

import { RATING_CHART_CONFIG, RATING_DISTRO_CHART_CONFIG } from './chart-configs'
import styles from './UIPrototypeDetailsModal.module.scss'

type UIPrototypeViewTypes = 'STATISTICS' | 'CHALLENGES DETAILS'

interface UIPrototypeDetailsModalProps {
    onClose: () => void
    uiPrototypeStats: MemberStats | undefined
    profile: UserProfile | undefined
}

const UIPrototypeDetailsModal: FC<UIPrototypeDetailsModalProps> = (props: UIPrototypeDetailsModalProps) => {
    const [viewType, setviewType]: [UIPrototypeViewTypes, Dispatch<SetStateAction<UIPrototypeViewTypes>>]
        = useState<UIPrototypeViewTypes>('STATISTICS')

    const statsHistory: UserStatsHistory | undefined = useStatsHistory(props.profile?.handle)

    const ratingHistoryOptions: Highcharts.Options | undefined = useMemo(() => {
        const uiProtypeHistory: Array<StatsHistory> | undefined
            = statsHistory?.DEVELOP?.subTracks?.find(subTrack => subTrack.name === 'UI_PROTOTYPE_COMPETITION')?.history
        const options: Highcharts.Options = RATING_CHART_CONFIG

        if (!uiProtypeHistory?.length) return undefined

        options.series = [{
            data: uiProtypeHistory.sort((a, b) => b.date - a.date)
                .map((testChallenge: StatsHistory) => ({
                    name: testChallenge.challengeName, x: testChallenge.ratingDate, y: testChallenge.newRating,
                })),
            name: 'UI Prototype Rating',
            type: 'spline',
        }]

        return options
    }, [statsHistory])

    const memberStatsDist: UserStatsDistributionResponse | undefined = useStatsDistribution({
        filter: 'track=DEVELOP&subTrack=UI_PROTOTYPE_COMPETITION',
    })

    const ratingDistributionOptions: Highcharts.Options | undefined = useMemo(() => {
        const ratingDistro: { [key: string]: number } = memberStatsDist?.distribution || {}
        const options: Highcharts.Options = RATING_DISTRO_CHART_CONFIG

        if (isEmpty(ratingDistro)) return undefined

        options.series = keys(ratingDistro)
            .map((key: string) => ({
                data: [ratingDistro[key]],
                name: key.split('ratingRange')[1],
                type: 'column',
            }))

        return options
    }, [memberStatsDist])

    // TODO: Enable this when we have challenges details data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function toggleViewType(newViewType: UIPrototypeViewTypes): void {
        setviewType(newViewType)
    }

    return (
        <BaseModal
            open
            onClose={props.onClose}
            size='body'
            title='UI PROTOTYPE COMPETITION'
        >
            <LoadingSpinner hide={!!statsHistory && !!memberStatsDist} />

            {!!statsHistory && !!memberStatsDist && (
                <div className={styles.container}>
                    <div className='member-stat-header'>
                        <div>
                            <span
                                className='member-stat-value'
                                style={ratingToCSScolor(props.uiPrototypeStats?.rank.rating || 0)}
                            >
                                {props.uiPrototypeStats?.rank.rating}
                            </span>
                            Rating
                        </div>
                        <div>
                            <span className='member-stat-value'>{props.uiPrototypeStats?.rank.overallRank}</span>
                            Rank
                        </div>
                        <div>
                            <span className='member-stat-value'>
                                {numberToFixed(props.uiPrototypeStats?.rank.overallPercentile || 0)}
                                %
                            </span>
                            Percentile
                        </div>
                        <div>
                            <span className='member-stat-value'>{props.uiPrototypeStats?.wins}</span>
                            Wins
                        </div>
                        <div>
                            <span className='member-stat-value'>{props.uiPrototypeStats?.challenges}</span>
                            Challenges
                        </div>
                    </div>

                    <div className={styles.content}>
                        <div className={styles.contentHeader}>
                            <h4>{viewType}</h4>
                            {/* TODO: Add UI Prototype details data */}
                            {/* <div className={styles.contentHeaderActions}>
                                <Button
                                    primary
                                    onClick={bind(
                                        toggleViewType,
                                        this,
                                        viewType !== 'CHALLENGES DETAILS' ? 'CHALLENGES DETAILS' : 'STATISTICS',
                                    )}
                                >
                                    See
                                    {' '}
                                    {viewType !== 'CHALLENGES DETAILS' ? 'CHALLENGES DETAILS' : 'STATISTICS'}
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
                                viewType === 'CHALLENGES DETAILS' && (
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

export default UIPrototypeDetailsModal
