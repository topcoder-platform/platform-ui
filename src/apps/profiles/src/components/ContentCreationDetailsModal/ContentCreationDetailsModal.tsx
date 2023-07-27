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
import styles from './ContentCreationDetailsModal.module.scss'

type TestScenViewTypes = 'STATISTICS' | 'CHALLENGES DETAILS'

interface ContentCreationDetailsModalProps {
    isContentCreationDetailsOpen: boolean
    onClose: () => void
    contentCreationStats: MemberStats | undefined
    profile: UserProfile | undefined
}

const ContentCreationDetailsModal: FC<ContentCreationDetailsModalProps> = (props: ContentCreationDetailsModalProps) => {
    const [viewType, setviewType]: [TestScenViewTypes, Dispatch<SetStateAction<TestScenViewTypes>>]
        = useState<TestScenViewTypes>('STATISTICS')

    const statsHistory: UserStatsHistory | undefined = useStatsHistory(props.profile?.handle)

    const ratingHistoryOptions: Highcharts.Options | undefined = useMemo(() => {
        const contentCreationHistory: Array<StatsHistory> | undefined
            = statsHistory?.DEVELOP?.subTracks?.find(subTrack => subTrack.name === 'CONTENT_CREATION')?.history
        const options: Highcharts.Options = RATING_CHART_CONFIG

        if (!contentCreationHistory?.length) return undefined

        options.series = [{
            data: contentCreationHistory.sort((a, b) => b.date - a.date)
                .map((testChallenge: StatsHistory) => ({
                    name: testChallenge.challengeName, x: testChallenge.ratingDate, y: testChallenge.newRating,
                })),
            name: 'Content Creation Rating',
            type: 'spline',
        }]

        return options
    }, [statsHistory])

    const memberStatsDist: UserStatsDistributionResponse | undefined = useStatsDistribution({
        filter: 'track=DEVELOP&subTrack=CONTENT_CREATION',
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
    function toggleViewType(newViewType: TestScenViewTypes): void {
        setviewType(newViewType)
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open={props.isContentCreationDetailsOpen}
            size='body'
            title='CONTENT CREATION'
        >
            <LoadingSpinner hide={!!statsHistory && !!memberStatsDist} />

            {!!statsHistory && !!memberStatsDist && (
                <div className={styles.container}>
                    <div className='member-stat-header'>
                        <div>
                            <span
                                className='member-stat-value'
                                style={ratingToCSScolor(props.contentCreationStats?.rank.rating || 0)}
                            >
                                {props.contentCreationStats?.rank.rating}
                            </span>
                            Rating
                        </div>
                        <div>
                            <span className='member-stat-value'>{props.contentCreationStats?.rank.overallRank}</span>
                            Rank
                        </div>
                        <div>
                            <span className='member-stat-value'>
                                {numberToFixed(props.contentCreationStats?.rank.overallPercentile || 0)}
                                %
                            </span>
                            Percentile
                        </div>
                        <div>
                            <span className='member-stat-value'>{props.contentCreationStats?.wins}</span>
                            Wins
                        </div>
                        <div>
                            <span className='member-stat-value'>{props.contentCreationStats?.challenges}</span>
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

export default ContentCreationDetailsModal
