import { FC } from 'react'
import { find, get } from 'lodash'

import { MemberStats, StatsHistory, UserProfile, UserStatsHistory, useStatsHistory } from '~/libs/core'

import { ChallengeHistoryCard } from './ChallengeHistoryCard'
import styles from './ChallengeHistoryView.module.scss'

interface ChallengeHistoryViewProps {
    profile: UserProfile
    trackData: MemberStats
}

const ChallengeHistoryView: FC<ChallengeHistoryViewProps> = props => {
    const statsHistory: UserStatsHistory | undefined = useStatsHistory(props.profile?.handle)
    const trackHistory: StatsHistory[] = get(
        find(get(statsHistory, `${props.trackData.parent}`, []), { name: props.trackData.name }),
        'history',
        [],
    )
    return (
        <div className={styles.wrap}>
            {trackHistory.map(challenge => (
                <ChallengeHistoryCard
                    challenge={challenge}
                    key={challenge.challengeId}
                />
            ))}
        </div>
    )
}

export default ChallengeHistoryView
