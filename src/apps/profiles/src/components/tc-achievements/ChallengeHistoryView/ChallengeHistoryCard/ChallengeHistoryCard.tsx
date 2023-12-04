import { FC } from 'react'
import classNames from 'classnames'

import { IconSolid } from '~/libs/ui'
import { getRatingColor, StatsHistory } from '~/libs/core'
import { EnvironmentConfig } from '~/config'

import { WinnerIcon } from '../../../../lib'

import styles from './ChallengeHistoryCard.module.scss'

interface ChallengeHistoryCardProps {
    challenge: StatsHistory
}

const ChallengeHistoryCard: FC<ChallengeHistoryCardProps> = props => {
    const rating = props.challenge.newRating ?? props.challenge.rating
    const placement = props.challenge.placement

    return (
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
                    {placement && (
                        <div className={styles.statsItem}>
                            <WinnerIcon
                                className={
                                    classNames(
                                        'icon-xxl',
                                        styles.statsItemIcon,
                                        styles[`placement-${placement}`],
                                    )
                                }
                            />
                            <span className={styles.statsItemValue}>
                                {placement}
                            </span>
                            <span className={styles.statsItemLabel}>
                                placement
                            </span>
                        </div>
                    )}
                    {rating && (
                        <div className={styles.statsItem}>
                            <span
                                className={styles.statsItemValue}
                                style={{ color: getRatingColor(rating) }}
                            >
                                {rating}
                            </span>
                            <span className={styles.statsItemLabel}>
                                rating
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
}

export default ChallengeHistoryCard
