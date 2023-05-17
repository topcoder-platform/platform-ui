import { Dispatch, FC, SetStateAction, useMemo, useState } from "react"
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import { BaseModal, Button } from "~/libs/ui"
import { SRMHistory, SRMStats, UserProfile, UserStatsHistory, ratingToCSScolor, useStatsHistory } from "~/libs/core"
import { ChallengesGrid } from "../ChallengesGrid"
import { DivisionGrid } from "../DivisionGrid"
import { RATING_CHART_CONFIG } from "./chart-configs"

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

    const StatsHistory: UserStatsHistory | undefined = useStatsHistory(profile?.handle)

    const ratingHistoryOptions: Highcharts.Options = useMemo(() => {
        const SRMHistory: Array<SRMHistory> = StatsHistory?.DATA_SCIENCE?.SRM?.history || []
        const options: Highcharts.Options = RATING_CHART_CONFIG

        options.series = [{
            type: 'spline',
            name: 'SRM Rating',
            data: SRMHistory.sort((a, b) => b.date - a.date).map((srm: SRMHistory) => ({ x: srm.date, y: srm.rating, name: srm.challengeName }))
        }]

        return options
    }, [StatsHistory])

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
                                    <HighchartsReact
                                        highcharts={Highcharts}
                                        options={ratingHistoryOptions}
                                    />
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
        </BaseModal>
    )
}

export default SRMDetailsModal
