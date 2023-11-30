import { FC } from 'react'

import { MemberStats, StatsHistory, UserProfile } from '~/libs/core'

import { useTrackHistory } from '../../../hooks'

import { ChallengeHistoryCard } from './ChallengeHistoryCard'
import styles from './ChallengeHistoryView.module.scss'

interface ChallengeHistoryViewProps {
    profile: UserProfile
    trackData: MemberStats
}

const ChallengeHistoryView: FC<ChallengeHistoryViewProps> = props => {
    const trackHistory: StatsHistory[] = useTrackHistory(props.profile?.handle, props.trackData)

    return (
        <div className={styles.wrap}>
            <div className={styles.inner}>
                {trackHistory.map(challenge => (
                    <ChallengeHistoryCard
                        challenge={challenge}
                        key={challenge.challengeId}
                    />
                ))}
            </div>
        </div>
    )
}

export default ChallengeHistoryView
