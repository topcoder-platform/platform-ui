/**
 * Scorecard Details Header.
 */
import { FC } from 'react'

import { Button } from '~/libs/ui'

import { ScorecardInfo } from '../../models'

import styles from './ScorecardDetailsHeader.module.scss'

interface Props {
    isEdit: boolean
    scorecardInfo?: ScorecardInfo
    reviewProgress?: number
    totalScore?: number
    expandAll?: () => void
    collapseAll?: () => void
}

export const ScorecardDetailsHeader: FC<Props> = (props: Props) => (
    <div className={styles.blockTitle}>
        <div className={styles.blockTitleLeft}>
            <span className={styles.textTitle}>
                {props.scorecardInfo?.name ?? ''}
            </span>
            <span className={styles.textCompleted}>
                {`${props.reviewProgress ?? '0'}% Completed`}
            </span>
        </div>

        {props.isEdit ? (
            <div className={styles.blockBtns}>
                <Button
                    label='Expand All'
                    secondary
                    size='lg'
                    onClick={props.expandAll}
                />
                <Button
                    label='Collapse All'
                    secondary
                    size='lg'
                    onClick={props.collapseAll}
                />
                <div className={styles.textTotalScore}>
                    <span>Total Score:</span>
                    <span>{props.totalScore}</span>
                </div>
            </div>
        ) : (
            <div className={styles.textTotalScore}>
                <span>Total Score:</span>
                <span>{props.totalScore}</span>
            </div>
        )}
    </div>
)

export default ScorecardDetailsHeader
