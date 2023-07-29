/* eslint-disable complexity */
import { Dispatch, FC, SetStateAction, useMemo, useState } from 'react'
import { isEmpty, keys } from 'lodash'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

import { BaseModal, LoadingSpinner } from '~/libs/ui'
import {
    MemberStats,
    StatsHistory,
    UserProfile,
    UserStatsDistributionResponse,
    UserStatsHistory,
    useStatsDistribution,
    useStatsHistory,
} from '~/libs/core'

import { numberToFixed } from '../../lib'

import { RATING_CHART_CONFIG, RATING_DISTRO_CHART_CONFIG } from './chart-configs'
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

    const ratingHistoryOptions: Highcharts.Options | undefined = useMemo(() => {
        const codeHistory: Array<StatsHistory> | undefined
            = statsHistory?.DEVELOP?.subTracks?.find(subTrack => subTrack.name === 'CODE')?.history
        const options: Highcharts.Options = RATING_CHART_CONFIG

        if (!codeHistory?.length) return undefined

        options.series = [{
            data: codeHistory.sort((a, b) => b.date - a.date)
                .map((testChallenge: StatsHistory) => ({
                    name: testChallenge.challengeName, x: testChallenge.ratingDate, y: testChallenge.newRating,
                })),
            name: 'Code Rating',
            type: 'spline',
        }]

        return options
    }, [statsHistory])

    const memberStatsDist: UserStatsDistributionResponse | undefined = useStatsDistribution({
        filter: 'track=DEVELOP&subTrack=CODE',
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
