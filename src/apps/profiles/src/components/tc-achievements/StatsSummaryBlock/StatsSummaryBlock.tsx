import { FC } from 'react'

import { ratingToCSScolor } from '~/libs/core'

import styles from './StatsSummaryBlock.module.scss'

interface StatsSummaryBlockProps {
    trackTitle: string
    challenges?: number
    wins?: number
    submissions?: number
    ranking?: number
    rating?: number
    volatility?: number
}

const StatsSummaryBlock: FC<StatsSummaryBlockProps> = props => (
    <div className={styles.wrap}>
        <div className={styles.title}>
            <span className='body-main-medium'>
                {props.trackTitle}
                &nbsp;Stats
            </span>
        </div>
        <div className={styles.summary}>
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
            {props.submissions !== undefined && (
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
            {props.ranking !== undefined && (
                <div className={styles.summaryItem}>
                    <span className={styles.summaryItemValue}>
                        {props.ranking}
                        %
                    </span>
                    <span className={styles.summaryItemLabel}>
                        <span className='body-small'>
                            Percentile
                        </span>
                    </span>
                </div>
            )}
            {props.volatility !== undefined && (
                <div className={styles.summaryItem}>
                    <span className={styles.summaryItemValue}>
                        {props.volatility}
                    </span>
                    <span className={styles.summaryItemLabel}>
                        <span className='body-small'>volatility</span>
                    </span>
                </div>
            )}
            {props.rating !== undefined && (
                <div className={styles.summaryItem}>
                    <span className={styles.summaryItemValue} style={ratingToCSScolor(props.rating)}>
                        {props.rating}
                    </span>
                    <span className={styles.summaryItemLabel}>
                        <span className='body-small'>rating</span>
                    </span>
                </div>
            )}
        </div>
    </div>
)

export default StatsSummaryBlock
