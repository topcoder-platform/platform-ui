/* eslint-disable complexity */
import { Dispatch, FC, SetStateAction, useState } from 'react'
import { bind } from 'lodash'
import AnnotationsModule from 'highcharts/modules/annotations'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

import { BaseModal, Button, LoadingSpinner } from '~/libs/ui'
import {
    ratingToCSScolor,
    SRMStats,
    UserProfile,
    UserStatsDistributionResponse,
    UserStatsHistory,
    useStatsDistribution,
    useStatsHistory,
} from '~/libs/core'

import { ChallengesGrid } from '../ChallengesGrid'
import { DivisionGrid } from '../DivisionGrid'
import { useRatingDistroOptions, useRatingHistoryOptions } from '../../hooks'

import styles from './SRMDetailsModal.module.scss'

type SRMViewTypes = 'STATISTICS' | 'SRM DETAILS' | 'PAST SRM'

interface SRMDetailsModalProps {
    onClose: () => void
    SRMStats: SRMStats | undefined
    profile: UserProfile | undefined
}

AnnotationsModule(Highcharts)

const SRMDetailsModal: FC<SRMDetailsModalProps> = (props: SRMDetailsModalProps) => {
    const [viewType, setviewType]: [SRMViewTypes, Dispatch<SetStateAction<SRMViewTypes>>]
        = useState<SRMViewTypes>('STATISTICS')

    const statsHistory: UserStatsHistory | undefined = useStatsHistory(props.profile?.handle)

    const ratingHistoryOptions: Highcharts.Options | undefined
        = useRatingHistoryOptions(
            statsHistory?.DATA_SCIENCE?.SRM?.history,
            'SRM Rating',
            'date',
            'rating',
        )

    const memberStatsDist: UserStatsDistributionResponse | undefined = useStatsDistribution({
        subTrack: 'SRM',
        track: 'DATA_SCIENC',
    })

    const ratingDistributionOptions: Highcharts.Options | undefined
        = useRatingDistroOptions(memberStatsDist?.distribution || {}, props.SRMStats?.rank.rating)

    function toggleViewType(newViewType: SRMViewTypes): void {
        setviewType(newViewType)
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open
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
                                {/* TODO: Enable this when we have challenges details data */}
                                {/* <Button
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
                                </Button> */}
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
