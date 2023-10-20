/* eslint-disable complexity */
import { Dispatch, FC, SetStateAction, useState } from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

import { BaseModal, LoadingSpinner } from '~/libs/ui'
import {
    MemberStats,
    UserProfile,
    UserStatsDistributionResponse,
    UserStatsHistory,
    useStatsDistribution,
    useStatsHistory,
} from '~/libs/core'

import { numberToFixed } from '../../lib'
import { useRatingDistroOptions, useRatingHistoryOptions } from '../../hooks'

import styles from './CodeDetailsModal.module.scss'

type CodeViewTypes = 'STATISTICS' | 'CHALLENGES DETAILS'

interface CodeDetailsModalProps {
    onClose: () => void
    codeStats: MemberStats | undefined
    profile: UserProfile | undefined
}

const CodeDetailsModal: FC<CodeDetailsModalProps> = (props: CodeDetailsModalProps) => {
    const [viewType, setviewType]: [CodeViewTypes, Dispatch<SetStateAction<CodeViewTypes>>]
        = useState<CodeViewTypes>('STATISTICS')

    const statsHistory: UserStatsHistory | undefined = useStatsHistory(props.profile?.handle)

    const ratingHistoryOptions: Highcharts.Options | undefined
        = useRatingHistoryOptions(
            statsHistory?.DEVELOP?.subTracks?.find(subTrack => subTrack.name === 'CODE')?.history,
            'Code Rating',
        )

    const memberStatsDist: UserStatsDistributionResponse | undefined = useStatsDistribution({
        subTrack: 'CODE',
        track: 'DEVELOP',
    })

    const ratingDistributionOptions: Highcharts.Options | undefined
        = useRatingDistroOptions(memberStatsDist?.distribution || {}, props.codeStats?.rank.rating)

    // TODO: Enable this when we have challenges details data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function toggleViewType(newViewType: CodeViewTypes): void {
        setviewType(newViewType)
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open
            size='body'
            title='Code'
        >
            <LoadingSpinner hide={!!statsHistory && !!memberStatsDist} />

            {!!statsHistory && !!memberStatsDist && (
                <div className={styles.container}>
                    <div className='member-stat-header'>
                        <div>
                            <span className='member-stat-value'>
                                {numberToFixed(props.codeStats?.rank.overallPercentile || 0)}
                                %
                            </span>
                            Percentile
                        </div>
                        <div>
                            <span className='member-stat-value'>{props.codeStats?.wins}</span>
                            Wins
                        </div>
                        <div>
                            <span className='member-stat-value'>{props.codeStats?.challenges}</span>
                            Challenges
                        </div>
                    </div>

                    <div className={styles.content}>
                        <div className={styles.contentHeader}>
                            <h4>{viewType}</h4>
                            {/* TODO: Add button when we have challenges details data */}
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

export default CodeDetailsModal
