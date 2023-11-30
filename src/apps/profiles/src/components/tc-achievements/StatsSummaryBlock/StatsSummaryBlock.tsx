/* eslint-disable complexity */
import { FC } from 'react'
import { find, get } from 'lodash'

import { getRatingColor } from '~/libs/core'

import { numberToFixed } from '../../../lib'
import { TracksSummaryStats } from '../../../config'

import styles from './StatsSummaryBlock.module.scss'

interface StatsSummaryBlockProps {
    trackId?: string | number
    trackTitle: string
    challenges?: number
    wins?: number
    submissions?: number
    ranking?: number
    rating?: number
    percentile?: number
    screeningSuccessRate?: number
    submissionRate?: number
    volatility?: number
}

const StatsSummaryBlock: FC<StatsSummaryBlockProps> = props => {
    const visibleFields = get(find(TracksSummaryStats, {
        ...(props.trackId ? { id: props.trackId } : {}),
        name: props.trackTitle,
    }), 'fields')

    const isFieldVisible = (field: string): boolean => (
        !visibleFields || visibleFields[field]
    )

    return (
        <div className={styles.wrap}>
            <div className={styles.title}>
                <span className='body-main-medium'>
                    {props.trackTitle}
                    &nbsp;Stats
                </span>
            </div>
            <div className={styles.summary}>
                {isFieldVisible('challenges') && (
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryItemValue}>
                            {props.challenges}
                        </span>
                        <span className={styles.summaryItemLabel}>
                            <span className='body-small'>
                                {props.trackTitle === 'Single Round Match' ? 'Competitions' : 'Challenges'}
                            </span>
                        </span>
                    </div>
                )}
                {isFieldVisible('wins') && (
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryItemValue}>
                            {props.wins}
                        </span>
                        <span className={styles.summaryItemLabel}>
                            <span className='body-small'>
                                Wins
                            </span>
                        </span>
                    </div>
                )}
                {isFieldVisible('submissions') && props.submissions !== undefined && (
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryItemValue}>
                            {props.submissions}
                        </span>
                        <span className={styles.summaryItemLabel}>
                            <span className='body-small'>
                                Submissions
                            </span>
                        </span>
                    </div>
                )}
                {isFieldVisible('ranking') && props.ranking !== undefined && (
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryItemValue}>
                            {props.ranking}
                        </span>
                        <span className={styles.summaryItemLabel}>
                            <span className='body-small'>
                                Rank
                            </span>
                        </span>
                    </div>
                )}
                {isFieldVisible('rating') && props.rating !== undefined && (
                    <div className={styles.summaryItem}>
                        <span
                            className={styles.summaryItemValue}
                            style={{ color: getRatingColor(props.rating) }}
                        >
                            {props.rating}
                        </span>
                        <span className={styles.summaryItemLabel}>
                            <span className='body-small'>rating</span>
                        </span>
                    </div>
                )}
                {isFieldVisible('volatility') && props.volatility !== undefined && (
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryItemValue}>
                            {props.volatility}
                        </span>
                        <span className={styles.summaryItemLabel}>
                            <span className='body-small'>volatility</span>
                        </span>
                    </div>
                )}
                {isFieldVisible('screeningSuccessRate') && props.screeningSuccessRate !== undefined && (
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryItemValue}>
                            {numberToFixed(props.screeningSuccessRate * 100)}
                            %
                        </span>
                        <span className={styles.summaryItemLabel}>
                            <span className='body-small'>Screening Success Rate</span>
                        </span>
                    </div>
                )}
                {isFieldVisible('submissionRate') && props.submissionRate !== undefined && (
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryItemValue}>
                            {numberToFixed(props.submissionRate * 100)}
                            %
                        </span>
                        <span className={styles.summaryItemLabel}>
                            <span className='body-small'>Submission Rate</span>
                        </span>
                    </div>
                )}
                {isFieldVisible('percentile') && props.percentile !== undefined && (
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryItemValue}>
                            {numberToFixed(props.percentile)}
                            %
                        </span>
                        <span className={styles.summaryItemLabel}>
                            <span className='body-small'>Percentile</span>
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}

export default StatsSummaryBlock
