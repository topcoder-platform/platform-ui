/* eslint-disable complexity */
import { Dispatch, FC, SetStateAction, useMemo, useState } from 'react'
import { bind, isEmpty, keys } from 'lodash'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

import { BaseModal, Button, LoadingSpinner } from '~/libs/ui'
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

import { RATING_CHART_CONFIG, RATING_DISTRO_CHART_CONFIG } from './chart-configs'
import styles from './TestScenariosDetailsModal.module.scss'

type TestScenViewTypes = 'STATISTICS' | 'CHALLENGES DETAILS'

interface SRMDetailsModalProps {
    isTestScenDetailsOpen: boolean
    onClose: () => void
    testScenStats: MemberStats | undefined
    profile: UserProfile | undefined
}

const TestScenariosDetailsModal: FC<SRMDetailsModalProps> = (props: SRMDetailsModalProps) => {
    const [viewType, setviewType]: [TestScenViewTypes, Dispatch<SetStateAction<TestScenViewTypes>>]
        = useState<TestScenViewTypes>('STATISTICS')

    const statsHistory: UserStatsHistory | undefined = useStatsHistory(props.profile?.handle)

    const ratingHistoryOptions: Highcharts.Options | undefined = useMemo(() => {
        const testScenHistory: Array<StatsHistory> | undefined
            = statsHistory?.DEVELOP?.subTracks?.find(subTrack => subTrack.name === 'TEST_SCENARIOS')?.history
        const options: Highcharts.Options = RATING_CHART_CONFIG

        if (!testScenHistory?.length) return undefined

        options.series = [{
            data: testScenHistory.sort((a, b) => b.date - a.date)
                .map((testChallenge: StatsHistory) => ({
                    name: testChallenge.challengeName, x: testChallenge.ratingDate, y: testChallenge.newRating,
                })),
            name: 'SRM Rating',
            type: 'spline',
        }]

        return options
    }, [statsHistory])

    const memberStatsDist: UserStatsDistributionResponse | undefined = useStatsDistribution({
        filter: 'track=DEVELOP&subTrack=TEST_SCENARIOS',
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

    function toggleViewType(newViewType: TestScenViewTypes): void {
        setviewType(newViewType)
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open={props.isTestScenDetailsOpen}
            size='body'
            title='TEST SCENARIOS'
        >
            <LoadingSpinner hide={!!statsHistory && !!memberStatsDist} />

            {!!statsHistory && !!memberStatsDist && (
                <div className={styles.container}>
                    <div className='member-stat-header'>
                        <div>
                            <span
                                className='member-stat-value'
                                style={ratingToCSScolor(props.testScenStats?.rank.rating || 0)}
                            >
                                {props.testScenStats?.rank.rating}
                            </span>
                            Rating
                        </div>
                        <div>
                            <span className='member-stat-value'>{props.testScenStats?.rank.overallRank}</span>
                            Rank
                        </div>
                        <div>
                            <span className='member-stat-value'>
                                {Number(props.testScenStats?.rank.overallPercentile)
                                    .toFixed(2)}
                                %
                            </span>
                            Percentile
                        </div>
                        <div>
                            <span className='member-stat-value'>{props.testScenStats?.wins}</span>
                            Wins
                        </div>
                        <div>
                            <span className='member-stat-value'>{props.testScenStats?.challenges}</span>
                            Challenges
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
                                        viewType !== 'CHALLENGES DETAILS' ? 'CHALLENGES DETAILS' : 'STATISTICS',
                                    )}
                                >
                                    See
                                    {' '}
                                    {viewType !== 'CHALLENGES DETAILS' ? 'CHALLENGES DETAILS' : 'STATISTICS'}
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

export default TestScenariosDetailsModal
