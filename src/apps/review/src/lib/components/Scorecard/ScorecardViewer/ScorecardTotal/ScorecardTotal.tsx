import { FC } from 'react'

import { ScorecardScore } from '../ScorecardScore'

import styles from './ScorecardTotal.module.scss'

interface ScorecardTotalProps {
    score?: number
}

const ScorecardTotal: FC<ScorecardTotalProps> = props => (
    <div className={styles.wrap}>
        <strong>Total Score</strong>
        <span className={styles.mx} />
        <ScorecardScore
            score={props.score ?? 0}
            scaleMax={100}
            weight={100}
        />
    </div>
)

export default ScorecardTotal
