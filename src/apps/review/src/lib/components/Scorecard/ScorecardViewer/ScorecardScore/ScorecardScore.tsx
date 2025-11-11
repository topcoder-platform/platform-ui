import { FC } from 'react'

import styles from './ScorecardScore.module.scss'

interface ScorecardScoreProps {
    score: number
    scaleMax: number
    weight: number
}

export const calcScore = (score: number, scaleMax: number, weight: number): number => (
    (score / (scaleMax || 1)) * weight
)

const ScorecardScore: FC<ScorecardScoreProps> = props => {
    let score = calcScore(props.score, props.scaleMax, props.weight)?.toFixed(2)
    if (props.score.toString() === 'NaN') {
        score = '-';
    }

    return (
        <div className={styles.wrap}>
            <strong>
                {score}
            </strong>
            <span>/</span>
            <span>
                {props.weight.toFixed(2)}
            </span>
        </div>
    )
}

export default ScorecardScore
