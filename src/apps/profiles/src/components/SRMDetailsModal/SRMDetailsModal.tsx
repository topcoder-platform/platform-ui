import { Dispatch, FC, SetStateAction, useMemo, useState } from "react"
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import { BaseModal, Button, LoadingSpinner } from "~/libs/ui"
import { SRMHistory, SRMStats, UserProfile, UserStatsDistributionResponse, UserStatsHistory, ratingToCSScolor, useStatsDistribution, useStatsHistory } from "~/libs/core"
import { ChallengesGrid } from "../ChallengesGrid"
import { DivisionGrid } from "../DivisionGrid"
import { RATING_CHART_CONFIG, RATING_DISTRO_CHART_CONFIG } from "./chart-configs"
import { isEmpty, keys } from "lodash"

import styles from "./SRMDetailsModal.module.scss"

type SRMViewTypes = 'STATISTICS' | 'SRM DETAILS' | 'PAST SRM'

interface SRMDetailsModalProps {
    isSRMDetailsOpen: boolean
    onClose: () => void
    SRMStats: SRMStats | undefined
    profile: UserProfile | undefined
}

const SRMDetailsModal: FC<SRMDetailsModalProps> = (props: SRMDetailsModalProps) => {
    const { isSRMDetailsOpen, onClose, SRMStats, profile } = props

    const [viewType, setviewType]: [SRMViewTypes, Dispatch<SetStateAction<SRMViewTypes>>] = useState<SRMViewTypes>('STATISTICS')

    const statsHistory: UserStatsHistory | undefined = useStatsHistory(profile?.handle)

    const ratingHistoryOptions: Highcharts.Options | undefined = useMemo(() => {
        const SRMHistory: Array<SRMHistory> = statsHistory?.DATA_SCIENCE?.SRM?.history || []
        const options: Highcharts.Options = RATING_CHART_CONFIG

        if (!SRMHistory.length) return undefined

        options.series = [{
            type: 'spline',
            name: 'SRM Rating',
            data: SRMHistory.sort((a, b) => b.date - a.date).map((srm: SRMHistory) => ({ x: srm.date, y: srm.rating, name: srm.challengeName }))
        }]

        return options
    }, [statsHistory])

    const memberStatsDist: UserStatsDistributionResponse | undefined = useStatsDistribution({
        filter: 'track=DATA_SCIENCE&subTrack=SRM'
    })

    const ratingDistributionOptions: Highcharts.Options | undefined = useMemo(() => {
        const ratingDistro = memberStatsDist?.distribution || {}
        const options: Highcharts.Options = RATING_DISTRO_CHART_CONFIG

        if (isEmpty(ratingDistro)) return undefined

        options.series = keys(ratingDistro)
            .map((key: string) => ({
                data: [ratingDistro[key]],
                name: key.split('ratingRange')[1],
                type: 'column'
            }))

        return options
    }, [memberStatsDist])

    function toggleViewType(viewType: SRMViewTypes): void {
        setviewType(viewType)
    }

    return (
        <BaseModal
            onClose={onClose}
            open={isSRMDetailsOpen}
            size='body'
            title="SINGLE ROUND MATCH"
        >
            <LoadingSpinner hide={!!statsHistory && !!memberStatsDist} />

            {!!statsHistory && !!memberStatsDist && (
                <div className={styles.container}>
                    <div className="member-stat-header">
                        <div>
                            <span className="member-stat-value" style={ratingToCSScolor(SRMStats?.rank.rating || 0)}>{SRMStats?.rank.rating}</span>
                            Rating
                        </div>
                        <div>
                            <span className="member-stat-value">{SRMStats?.rank.rank}</span>
                            Rank
                        </div>
                        <div>
                            <span className="member-stat-value">{SRMStats?.rank.percentile}%</span>
                            Percentile
                        </div>
                        <div>
                            <span className="member-stat-value">{SRMStats?.rank.competitions}%</span>
                            Competitions
                        </div>
                        <div>
                            <span className="member-stat-value">{SRMStats?.rank.volatility}</span>
                            Volatility
                        </div>
                    </div>

                    <div className={styles.content}>
                        <div className={styles.contentHeader}>
                            <h4>{viewType}</h4>
                            <div className={styles.contentHeaderActions}>
                                <Button primary onClick={() => toggleViewType(viewType !== 'SRM DETAILS' ? 'SRM DETAILS' : 'STATISTICS')}>See {viewType !== 'SRM DETAILS' ? 'SRM DETAILS' : 'STATISTICS'}</Button>
                                <Button primary onClick={() => toggleViewType(viewType !== 'PAST SRM' ? 'PAST SRM' : 'SRM DETAILS')}>See {viewType !== 'PAST SRM' ? 'PAST SRM' : 'SRM DETAILS'}</Button>
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
                                            SRMStats?.division1 && (
                                                <DivisionGrid divisionData={SRMStats.division1} number={1} />
                                            )
                                        }
                                        {
                                            SRMStats?.division2 && (
                                                <DivisionGrid divisionData={SRMStats.division2} number={2} />
                                            )
                                        }
                                        {
                                            SRMStats?.challengeDetails && (
                                                <ChallengesGrid challengesData={SRMStats.challengeDetails} />
                                            )
                                        }
                                    </div>
                                )

                            }
                            {
                                viewType === 'PAST SRM' && (
                                    <div></div>
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
