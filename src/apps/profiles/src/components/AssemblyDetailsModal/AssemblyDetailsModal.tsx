/* eslint-disable complexity */import { Dispatch, FC, SetStateAction, useMemo, useState } from 'react'
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
import styles from './AssemblyDetailsModal.module.scss'

type SRMViewTypes = 'STATISTICS' | 'CHALLENGES DETAILS'

interface AssemblyDetailsModalProps {
    isAssemblyDetailsOpen: boolean
    onClose: () => void
    assemblyStats: MemberStats | undefined
    profile: UserProfile | undefined
}

const AssemblyDetailsModal: FC<AssemblyDetailsModalProps> = (props: AssemblyDetailsModalProps) => {
    const [viewType, setviewType]: [SRMViewTypes, Dispatch<SetStateAction<SRMViewTypes>>]
        = useState<SRMViewTypes>('STATISTICS')

    const statsHistory: UserStatsHistory | undefined = useStatsHistory(props.profile?.handle)

    const ratingHistoryOptions: Highcharts.Options | undefined = useMemo(() => {
        const assemblyHistory: Array<StatsHistory> | undefined
            = statsHistory?.DEVELOP?.subTracks?.find(subTrack => subTrack.name === 'ASSEMBLY_COMPETITION')?.history
            || []
        const options: Highcharts.Options = RATING_CHART_CONFIG

        if (!assemblyHistory.length) return undefined

        options.series = [{
            data: assemblyHistory.sort((a, b) => b.date - a.date)
                .map((assemblyChallenge: StatsHistory) => ({
                    name: assemblyChallenge.challengeName,
                    x: assemblyChallenge.ratingDate,
                    y: assemblyChallenge.newRating,
                })),
            name: 'Assembly Competition Rating',
            type: 'spline',
        }]

        return options
    }, [statsHistory])

    const memberStatsDist: UserStatsDistributionResponse | undefined = useStatsDistribution({
        filter: 'track=DEVELOP&subTrack=ASSEMBLY_COMPETITION',
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

    // TODO: enable this function when challenges history is available
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function toggleViewType(newViewType: SRMViewTypes): void {
        setviewType(newViewType)
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open={props.isAssemblyDetailsOpen}
            size='body'
            title='ASSEMBLY COMPETITION'
        >
            <LoadingSpinner hide={!!statsHistory && !!memberStatsDist} />

            {!!statsHistory && !!memberStatsDist && (
                <div className={styles.container}>
                    <div className='member-stat-header'>
                        <div>
                            <span
                                className='member-stat-value'
                                style={ratingToCSScolor(props.assemblyStats?.rank.rating || 0)}
                            >
                                {props.assemblyStats?.rank.rating}
                            </span>
                            Rating
                        </div>
                        <div>
                            <span className='member-stat-value'>{props.assemblyStats?.rank.overallRank}</span>
                            Rank
                        </div>
                        <div>
                            <span className='member-stat-value'>
                                {numberToFixed(props.assemblyStats?.rank.overallPercentile || 0)}
                                %
                            </span>
                            Percentile
                        </div>
                        <div>
                            <span className='member-stat-value'>{props.assemblyStats?.wins}</span>
                            Wins
                        </div>
                        <div>
                            <span className='member-stat-value'>{props.assemblyStats?.challenges}</span>
                            Challenges
                        </div>
                    </div>

                    <div className={styles.content}>
                        {/* TODO: Add Assembly Details with challenges history */}
                        {/* <div className={styles.contentHeader}>
                            <h4>{viewType}</h4>
                            <div className={styles.contentHeaderActions}>
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
                            </div>
                        </div> */}

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

export default AssemblyDetailsModal
