import { FC } from 'react'

import styles from './ScorecardTotal.module.scss'
import { ScorecardScore } from '../ScorecardScore'

interface ScorecardTotalProps {
    score?: number
}

const ScorecardTotal: FC<ScorecardTotalProps> = props => {


    return (
        <div className={styles.wrap}>
            <strong>Total Score</strong>
            <span className={styles.mx} />
            <ScorecardScore
                score={props.score ?? 0}
                scaleMax={100}
                scaleType='SCALE'
                weight={100}
            />
        </div>
    )
}

export default ScorecardTotal
