import { FC, useState } from 'react'
import { get } from 'lodash'
import AnnotationsModule from 'highcharts/modules/annotations'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

import {
    MemberStats,
    SRMStats,
    UserProfile,
    UserStatsDistributionResponse,
    UserStatsHistory,
    useStatsDistribution,
    useStatsHistory,
} from '~/libs/core'
import { Button } from '~/libs/ui'

import { useRatingDistroOptions, useRatingHistoryOptions } from '../../../hooks'

import styles from './SRMView.module.scss'

interface SRMViewProps {
    profile: UserProfile
    trackData: SRMStats | MemberStats
}

AnnotationsModule(Highcharts)

enum Graphs {
    distribution = 'distribution',
    history = 'history',
}

const SRMView: FC<SRMViewProps> = props => {
    const [activeGraph, setActiveGraph] = useState<Graphs>(Graphs.distribution)
    const statsHistory: UserStatsHistory | undefined = useStatsHistory(props.profile?.handle)

    const trackName: string = (props.trackData as MemberStats).name ?? 'SRM'
    const ratingHistoryOptions: Highcharts.Options | undefined
        = useRatingHistoryOptions(
            get(statsHistory, `DATA_SCIENCE.${trackName}.history`),
            `${trackName} Rating`,
            'date',
            'rating',
        )

    const memberStatsDist: UserStatsDistributionResponse | undefined = useStatsDistribution({
        filter: `track=DATA_SCIENCE&subTrack=${trackName}`,
    })

    const ratingDistributionOptions: Highcharts.Options | undefined
        = useRatingDistroOptions(memberStatsDist?.distribution || {}, props.trackData.rank.rating)

    return (
        <div className={styles.wrap}>
            <div className={styles.btnsGroup}>
                <Button
                    className={styles.btn}
                    label='Rating
                    Distribution'
                    primary={activeGraph === Graphs.distribution}
                    secondary={activeGraph !== Graphs.distribution}
                    variant='linkblue'
                    onClick={function toggl() { setActiveGraph(Graphs.distribution) }}
                />
                <Button
                    className={styles.btn}
                    label='Rating
                    History'
                    primary={activeGraph === Graphs.history}
                    secondary={activeGraph !== Graphs.history}
                    variant='linkblue'
                    onClick={function toggl() { setActiveGraph(Graphs.history) }}
                />
            </div>
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
        </div>
    )
}

export default SRMView
