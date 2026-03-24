import { FC } from 'react'

import { StatsHistory } from '~/libs/core'

import { ChallengeHistoryCard } from './ChallengeHistoryCard'
import styles from './ChallengeHistoryView.module.scss'

interface ChallengeHistoryViewProps {
    trackHistory: StatsHistory[]
}

const ChallengeHistoryView: FC<ChallengeHistoryViewProps> = props => (
    <div className={styles.wrap}>
        <div className={styles.inner}>
            {props.trackHistory.map(challenge => (
                <ChallengeHistoryCard
                    challenge={challenge}
                    key={challenge.challengeId}
                />
            ))}
        </div>
    </div>
)

export default ChallengeHistoryView
