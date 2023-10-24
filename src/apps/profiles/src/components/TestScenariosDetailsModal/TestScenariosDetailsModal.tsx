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

import styles from './TestScenariosDetailsModal.module.scss'

type TestScenViewTypes = 'STATISTICS' | 'CHALLENGES DETAILS'

interface TestScenariosDetailsModalProps {
    onClose: () => void
    testScenStats: MemberStats | undefined
    profile: UserProfile | undefined
}

const TestScenariosDetailsModal: FC<TestScenariosDetailsModalProps> = (props: TestScenariosDetailsModalProps) => {
    const [viewType, setviewType]: [TestScenViewTypes, Dispatch<SetStateAction<TestScenViewTypes>>]
        = useState<TestScenViewTypes>('STATISTICS')

    const statsHistory: UserStatsHistory | undefined = useStatsHistory(props.profile?.handle)

    const ratingHistoryOptions: Highcharts.Options | undefined
        = useRatingHistoryOptions(
            statsHistory?.DEVELOP?.subTracks?.find(subTrack => subTrack.name === 'TEST_SCENARIOS')?.history,
            'Test Scenarios Rating',
        )

    const memberStatsDist: UserStatsDistributionResponse | undefined = useStatsDistribution({
        filter: 'track=DEVELOP&subTrack=TEST_SCENARIOS',
    })

    const ratingDistributionOptions: Highcharts.Options | undefined
        = useRatingDistroOptions(memberStatsDist?.distribution || {}, props.testScenStats?.rank.rating)

    // TODO: Enable this when we have challenges details data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function toggleViewType(newViewType: TestScenViewTypes): void {
        setviewType(newViewType)
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open
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
                                {numberToFixed(props.testScenStats?.rank.overallPercentile || 0)}
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
                            {/* TODO: Enable this when we have challenges details data */}
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

export default TestScenariosDetailsModal
