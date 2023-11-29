import { FC, ReactNode, useState } from 'react'
import AnnotationsModule from 'highcharts/modules/annotations'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import classNames from 'classnames'

import {
    MemberStats,
    SRMStats,
    StatsHistory,
    UserStatsDistributionResponse,
} from '~/libs/core'
import { Button } from '~/libs/ui'

import { useRatingDistroOptions, useRatingHistoryOptions } from '../../../hooks'
import { subTrackLabelToHumanName } from '../../../lib'

import styles from './DetailedTrackView.module.scss'

export enum ViewMode {
    statistics = 'statistics',
    details = 'details',
}

enum Graphs {
    distribution = 'distribution',
    history = 'history',
}

interface DetailedTrackViewProps {
    challengesLabel?: string
    trackData?: SRMStats | MemberStats
    trackHistory?: StatsHistory[]
    ratingDistribution?: UserStatsDistributionResponse
    showDetailsViewBtn?: boolean
    challengesDetailedView?: ReactNode
    defaultViewMode?: ViewMode
}

AnnotationsModule(Highcharts)

const DetailedTrackView: FC<DetailedTrackViewProps> = props => {
    const [activeGraph, setActiveGraph] = useState<Graphs>(Graphs.distribution)
    const [viewMode, setViewMode] = useState<ViewMode>(props.defaultViewMode ?? ViewMode.details)

    const trackName: string = (props.trackData as MemberStats).name ?? 'SRM'

    const ratingHistoryOptions: Highcharts.Options | undefined
        = useRatingHistoryOptions(
            props.trackHistory,
            `${subTrackLabelToHumanName(trackName)} Rating`,
        )

    const ratingDistributionOptions: Highcharts.Options | undefined
        = useRatingDistroOptions(props.ratingDistribution?.distribution || {}, props.trackData?.rank?.rating ?? 0)

    return (
        <div className={styles.wrap}>
            <div className={styles.btnsBar}>
                {viewMode === ViewMode.statistics && (
                    <div className={styles.btnsGroup}>
                        <Button
                            className={styles.btn}
                            label='Rating Distribution'
                            primary={activeGraph === Graphs.distribution}
                            secondary={activeGraph !== Graphs.distribution}
                            variant='linkblue'
                            onClick={function toggl() { setActiveGraph(Graphs.distribution) }}
                        />
                        <Button
                            className={styles.btn}
                            label='Rating History'
                            primary={activeGraph === Graphs.history}
                            secondary={activeGraph !== Graphs.history}
                            variant='linkblue'
                            onClick={function toggl() { setActiveGraph(Graphs.history) }}
                        />
                    </div>
                )}
                {props.showDetailsViewBtn && (
                    <div className={classNames(styles.btnsGroup, styles.toRight)}>
                        <Button
                            className={styles.btn}
                            label='Statistics'
                            primary={viewMode === ViewMode.statistics}
                            secondary={viewMode !== ViewMode.statistics}
                            variant='linkblue'
                            onClick={function togglViewMode() { setViewMode(ViewMode.statistics) }}
                        />
                        <Button
                            className={styles.btn}
                            label={`${props.challengesLabel ?? 'Challenges'} Details`}
                            primary={viewMode === ViewMode.details}
                            secondary={viewMode !== ViewMode.details}
                            variant='linkblue'
                            onClick={function togglViewMode() { setViewMode(ViewMode.details) }}
                        />
                    </div>
                )}
            </div>

            {viewMode === ViewMode.details && props.challengesDetailedView}

            {viewMode === ViewMode.statistics && (
                <>
                    {activeGraph === Graphs.history && ratingHistoryOptions && (
                        <HighchartsReact
                            highcharts={Highcharts}
                            options={ratingHistoryOptions}
                        />
                    )}

                    {activeGraph === Graphs.distribution && ratingDistributionOptions && (
                        <HighchartsReact
                            highcharts={Highcharts}
                            options={ratingDistributionOptions}
                        />
                    )}
                </>
            )}
        </div>
    )
}

export default DetailedTrackView
