/* eslint-disable complexity */
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

    const ratingHistoryOptions: Highcharts.Options | undefined
        = useRatingHistoryOptions(
            statsHistory?.DEVELOP?.subTracks?.find(subTrack => subTrack.name === 'UI_PROTOTYPE_COMPETITION')?.history,
            'UI Prototype Rating',
        )

    const memberStatsDist: UserStatsDistributionResponse | undefined = useStatsDistribution({
        subTrack: 'UI_PROTOTYPE_COMPETITION',
        track: 'DEVELOP',
    })

    const ratingDistributionOptions: Highcharts.Options | undefined
        = useRatingDistroOptions(memberStatsDist?.distribution || {}, props.uiPrototypeStats?.rank.rating)

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
