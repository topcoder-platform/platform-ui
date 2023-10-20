import { Dispatch, FC, SetStateAction, useState } from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

import { BaseModal, LoadingSpinner } from '~/libs/ui'
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

import styles from './AssemblyDetailsModal.module.scss'

type SRMViewTypes = 'STATISTICS' | 'CHALLENGES DETAILS'

interface AssemblyDetailsModalProps {
    onClose: () => void
    assemblyStats: MemberStats | undefined
    profile: UserProfile | undefined
}

const AssemblyDetailsModal: FC<AssemblyDetailsModalProps> = (props: AssemblyDetailsModalProps) => {
    const [viewType, setviewType]: [SRMViewTypes, Dispatch<SetStateAction<SRMViewTypes>>]
        = useState<SRMViewTypes>('STATISTICS')

    const statsHistory: UserStatsHistory | undefined = useStatsHistory(props.profile?.handle)

    const ratingHistoryOptions: Highcharts.Options | undefined
        = useRatingHistoryOptions(
            statsHistory?.DEVELOP?.subTracks?.find(subTrack => subTrack.name === 'ASSEMBLY_COMPETITION')?.history,
            'Assembly Competition Rating',
        )

    const memberStatsDist: UserStatsDistributionResponse | undefined = useStatsDistribution({
        subTrack: 'ASSEMBLY_COMPETITION',
        track: 'DEVELOP',
    })

    const ratingDistributionOptions: Highcharts.Options | undefined
        = useRatingDistroOptions(memberStatsDist?.distribution || {}, props.assemblyStats?.rank.rating)

    // TODO: enable this function when challenges history is available
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function toggleViewType(newViewType: SRMViewTypes): void {
        setviewType(newViewType)
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open
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

                        <div className={styles.contentHeader}>
                            <h4>{viewType}</h4>
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

export default AssemblyDetailsModal
