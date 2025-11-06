import { FC } from 'react'

import styles from './ScorecardScore.module.scss'
import { ScorecardQuestion } from '../../../../models'

interface ScorecardScoreProps {
    score: number
    scaleMax: number
    scaleType: ScorecardQuestion['type']
    weight: number
}

export const calcScore = (score: number, scaleMax: number, weight: number) => (
    (score / (scaleMax || 1)) * weight
)

const ScorecardScore: FC<ScorecardScoreProps> = props => {
    const score = calcScore(props.score, props.scaleMax, props.weight)

    return (
        <div className={styles.wrap}>
            <strong>
                {score.toFixed(2)}
            </strong>
            <span>/</span>
            <span>
                {props.weight.toFixed(2)}
            </span>
        </div>
    )
}

export default ScorecardScore
