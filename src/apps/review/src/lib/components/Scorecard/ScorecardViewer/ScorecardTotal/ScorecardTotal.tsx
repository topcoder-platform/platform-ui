import { FC } from 'react'

import { ScorecardScore } from '../ScorecardScore'
import { AiWorkflowRunStatus } from '../../../AiReviewsTable'

import styles from './ScorecardTotal.module.scss'

interface ScorecardTotalProps {
    score?: number
    minScore?: number
}

const ScorecardTotal: FC<ScorecardTotalProps> = props => {
    let status: 'passed' | 'pending' | 'failed-score' | undefined

    if ((props.score ?? 0) >= (props.minScore ?? 0)) {
        status = 'passed'
    } else {
        status = 'failed-score'
    }

    return (
        <div className={styles.wrap}>
            <strong>Total Score</strong>
            <span className={styles.mx} />
            <div className={styles.score}>
                <ScorecardScore
                    score={props.score ?? 0}
                    weight={100}
                />

                {status && (
                    <AiWorkflowRunStatus
                        status={status}
                        score={props.score}
                        hideLabel
                    />
                )}
            </div>
        </div>
    )
}

export default ScorecardTotal
