/* eslint-disable complexity */
import { FC } from 'react'

import { getRatingColor } from '~/libs/core'

import { numberToFixed } from '../../../lib'
import { TracksSummaryStats } from '../../../config'

import styles from './StatsSummaryBlock.module.scss'

interface StatsSummaryBlockProps {
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
    const visibleFields = TracksSummaryStats[props.trackTitle]?.fields

    return (
        <div className={styles.wrap}>
            <div className={styles.title}>
                <span className='body-main-medium'>
                    {props.trackTitle}
                    &nbsp;Stats
                </span>
            </div>
            <div className={styles.summary}>
                {(!visibleFields || visibleFields.challenges) && (
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryItemValue}>
                            {props.challenges}
                        </span>
                        <span className={styles.summaryItemLabel}>
                            <span className='body-small'>
                                Challenges
                            </span>
                        </span>
                    </div>
                )}
                {(!visibleFields || visibleFields.wins) && (
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
                {(!visibleFields || visibleFields.submissions) && props.submissions !== undefined && (
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
                {(!visibleFields || visibleFields.ranking) && props.ranking !== undefined && (
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
                {(!visibleFields || visibleFields.rating) && props.rating !== undefined && (
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
                {(!visibleFields || visibleFields.volatility) && props.volatility !== undefined && (
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryItemValue}>
                            {props.volatility}
                        </span>
                        <span className={styles.summaryItemLabel}>
                            <span className='body-small'>volatility</span>
                        </span>
                    </div>
                )}
                {(!visibleFields || visibleFields.screeningSuccessRate) && props.screeningSuccessRate !== undefined && (
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
                {(!visibleFields || visibleFields.submissionRate) && props.submissionRate !== undefined && (
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
                {(!visibleFields || visibleFields.percentile) && props.percentile !== undefined && (
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
