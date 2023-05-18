/* eslint-disable complexity */
import { Dispatch, FC, SetStateAction, useMemo, useState } from 'react'
import { bind, isEmpty, keys } from 'lodash'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

import { BaseModal, Button, LoadingSpinner } from '~/libs/ui'
import {
    ratingToCSScolor,
    SRMHistory,
    SRMStats,
    UserProfile,
    UserStatsDistributionResponse,
    UserStatsHistory,
    useStatsDistribution,
    useStatsHistory,
} from '~/libs/core'

import { ChallengesGrid } from '../ChallengesGrid'
import { DivisionGrid } from '../DivisionGrid'

import { RATING_CHART_CONFIG, RATING_DISTRO_CHART_CONFIG } from './chart-configs'
import styles from './SRMDetailsModal.module.scss'

type SRMViewTypes = 'STATISTICS' | 'SRM DETAILS' | 'PAST SRM'

interface SRMDetailsModalProps {
    isSRMDetailsOpen: boolean
    onClose: () => void
    SRMStats: SRMStats | undefined
    profile: UserProfile | undefined
}

const SRMDetailsModal: FC<SRMDetailsModalProps> = (props: SRMDetailsModalProps) => {
    const [viewType, setviewType]: [SRMViewTypes, Dispatch<SetStateAction<SRMViewTypes>>]
        = useState<SRMViewTypes>('STATISTICS')

    const statsHistory: UserStatsHistory | undefined = useStatsHistory(props.profile?.handle)

    const ratingHistoryOptions: Highcharts.Options | undefined = useMemo(() => {
        const srmHistory: Array<SRMHistory> = statsHistory?.DATA_SCIENCE?.SRM?.history || []
        const options: Highcharts.Options = RATING_CHART_CONFIG

        if (!srmHistory.length) return undefined

        options.series = [{
            data: srmHistory.sort((a, b) => b.date - a.date)
                .map((srm: SRMHistory) => ({ name: srm.challengeName, x: srm.date, y: srm.rating })),
            name: 'SRM Rating',
            type: 'spline',
        }]

        return options
    }, [statsHistory])

    const memberStatsDist: UserStatsDistributionResponse | undefined = useStatsDistribution({
        filter: 'track=DATA_SCIENCE&subTrack=SRM',
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

    function toggleViewType(newViewType: SRMViewTypes): void {
        setviewType(newViewType)
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open={props.isSRMDetailsOpen}
            size='body'
            title='SINGLE ROUND MATCH'
        >
            <LoadingSpinner hide={!!statsHistory && !!memberStatsDist} />

            {!!statsHistory && !!memberStatsDist && (
                <div className={styles.container}>
                    <div className='member-stat-header'>
                        <div>
                            <span
                                className='member-stat-value'
                                style={ratingToCSScolor(props.SRMStats?.rank.rating || 0)}
                            >
                                {props.SRMStats?.rank.rating}
                            </span>
                            Rating
                        </div>
                        <div>
                            <span className='member-stat-value'>{props.SRMStats?.rank.rank}</span>
                            Rank
                        </div>
                        <div>
                            <span className='member-stat-value'>
                                {props.SRMStats?.rank.percentile}
                                %
                            </span>
                            Percentile
                        </div>
                        <div>
                            <span className='member-stat-value'>
                                {props.SRMStats?.rank.competitions}
                                %
                            </span>
                            Competitions
                        </div>
                        <div>
                            <span className='member-stat-value'>{props.SRMStats?.rank.volatility}</span>
                            Volatility
                        </div>
                    </div>

                    <div className={styles.content}>
                        <div className={styles.contentHeader}>
                            <h4>{viewType}</h4>
                            <div className={styles.contentHeaderActions}>
                                <Button
                                    primary
                                    onClick={bind(
                                        toggleViewType,
                                        this,
                                        viewType !== 'SRM DETAILS' ? 'SRM DETAILS' : 'STATISTICS',
                                    )}
                                >
                                    See
                                    {' '}
                                    {viewType !== 'SRM DETAILS' ? 'SRM DETAILS' : 'STATISTICS'}
                                </Button>
                                <Button
                                    primary
                                    onClick={bind(
                                        toggleViewType,
                                        this,
                                        viewType !== 'PAST SRM' ? 'PAST SRM' : 'SRM DETAILS',
                                    )}
                                >
                                    See
                                    {' '}
                                    {viewType !== 'PAST SRM' ? 'PAST SRM' : 'SRM DETAILS'}
                                </Button>
                            </div>
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
                                viewType === 'SRM DETAILS' && (
                                    <div className={styles.details}>
                                        {
                                            props.SRMStats?.division1 && (
                                                <DivisionGrid divisionData={props.SRMStats.division1} number={1} />
                                            )
                                        }
                                        {
                                            props.SRMStats?.division2 && (
                                                <DivisionGrid divisionData={props.SRMStats.division2} number={2} />
                                            )
                                        }
                                        {
                                            props.SRMStats?.challengeDetails && (
                                                <ChallengesGrid challengesData={props.SRMStats.challengeDetails} />
                                            )
                                        }
                                    </div>
                                )

                            }
                            {
                                viewType === 'PAST SRM' && (
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

export default SRMDetailsModal
