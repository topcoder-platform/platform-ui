/**
 * Scorecard Details Header.
 */
import { FC } from 'react'
import classNames from 'classnames'

import { ScorecardInfo } from '../../models'
import { ProgressBar } from '../ProgressBar'

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
    <div className={classNames(styles.blockTitle, props.isEdit ? 'edit' : '')}>
        <div className={styles.blockTitleLeft}>
            <span className={styles.textTitle}>
                {props.scorecardInfo?.name ?? ''}
            </span>
            <span className={styles.textCompleted}>
                <ProgressBar progress={props.reviewProgress ?? 0} />
            </span>
        </div>

        <div className={styles.blockBtns}>
            <button type='button' className='borderButton' onClick={props.expandAll}>
                Expand All
            </button>
            <button type='button' className='borderButton' onClick={props.collapseAll}>
                Collapse All
            </button>
            <div className={styles.textTotalScore}>
                <span>Total Score:</span>
                <span>{props.totalScore}</span>
            </div>
        </div>
    </div>
)

export default ScorecardDetailsHeader
