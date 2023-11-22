import { FC } from 'react'

import { IconSolid } from '~/libs/ui'
import { getRatingColor, StatsHistory } from '~/libs/core'
import { EnvironmentConfig } from '~/config'

import styles from './ChallengeHistoryCard.module.scss'

interface ChallengeHistoryCardProps {
    challenge: StatsHistory
}

const ChallengeHistoryCard: FC<ChallengeHistoryCardProps> = props => (
    <a
        className={styles.wrap}
        href={`${EnvironmentConfig.URLS.CHALLENGES_PAGE}/${props.challenge.challengeId}`}
        target='_blank'
        rel='noreferrer'
    >
        <div className={styles.contentWrap}>
            <div className={styles.title}>
                <span className='body-small-bold'>
                    {props.challenge.challengeName}
                </span>
            </div>
            <div className={styles.statsWrap}>
                {props.challenge.newRating !== undefined && (
                    <div className={styles.statsItem}>
                        <span
                            className={styles.statsItemValue}
                            style={{ color: getRatingColor(props.challenge.newRating) }}
                        >
                            {props.challenge.newRating}
                        </span>
                        <span className={styles.statsItemLabel}>
                            <span className='label'>
                                rating
                            </span>
                        </span>
                    </div>
                )}
            </div>
        </div>
        <div className={styles.icon}>
            <IconSolid.ChevronRightIcon className='icon-xl' />
        </div>
    </a>
)

export default ChallengeHistoryCard
