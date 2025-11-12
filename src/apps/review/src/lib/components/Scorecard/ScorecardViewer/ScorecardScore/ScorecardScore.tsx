import { FC } from 'react'

import styles from './ScorecardScore.module.scss'

interface ScorecardScoreProps {
    score: number
    weight: number
}

const ScorecardScore: FC<ScorecardScoreProps> = props => (
    <div className={styles.wrap}>
        <strong>
            {props.score.toFixed(2)}
        </strong>
        <span>/</span>
        <span>
            {props.weight.toFixed(2)}
        </span>
    </div>
)

export default ScorecardScore
