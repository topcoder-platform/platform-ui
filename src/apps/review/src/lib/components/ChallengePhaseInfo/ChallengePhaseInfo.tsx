/**
 * Challenge Phase Info.
 */
import { FC, useMemo } from 'react'
import classNames from 'classnames'

import { ChallengeInfo } from '../../models'
import { ProgressBar } from '../ProgressBar'
import { useRole, useRoleProps } from '../../hooks'

import styles from './ChallengePhaseInfo.module.scss'

interface Props {
    className?: string
    challengeInfo: ChallengeInfo
    reviewProgress: number
}

export const ChallengePhaseInfo: FC<Props> = (props: Props) => {
    const { myChallengeRoles }: useRoleProps = useRole()
    const PROGRESS_TYPE = 'progress'
    const uiItems = useMemo(() => {
        const data = props.challengeInfo
        return [
            {
                icon: 'icon-review',
                title: 'Phase',
                value: data.currentPhase || 'N/A',
            },
            {
                icon: 'icon-handle',
                title: 'My Role',
                value: (
                    <div className={styles.blockMyRoles}>
                        {myChallengeRoles.map(item => (
                            <span key={item}>{item}</span>
                        ))}
                    </div>
                ),
            },
            {
                icon: 'icon-event',
                title: 'Phase End Date',
                value: data.currentPhaseEndDateString || 'N/A',
            },
            {
                icon: 'icon-timer',
                status: data.timeLeftStatus,
                style: {
                    color: data.timeLeftColor,
                },
                title: 'Time Left',
                value: data.timeLeft || 'N/A',
            },
            {
                title: 'Review Progress',
                type: PROGRESS_TYPE,
                value: props.reviewProgress,
            },
        ]
    }, [props.challengeInfo, myChallengeRoles, props.reviewProgress])
    return (
        <div className={classNames(styles.container, props.className)}>
            {uiItems.map(item => {
                if (item.type === PROGRESS_TYPE) {
                    return (
                        <div
                            className={classNames(
                                styles.progress,
                                styles.blockItem,
                            )}
                            key={item.title}
                        >
                            <ProgressBar
                                progress={item.value}
                                withoutPercentage
                                progressWidth='160px'
                            />
                            <div className={styles.progressText}>
                                <span>Review Progress</span>
                                <strong>
                                    {item.value}
                                    %
                                </strong>
                            </div>
                        </div>
                    )
                }

                return (
                    <div className={styles.blockItem} key={item.title}>
                        <span className={styles.circleWrapper}>
                            <i className={item.icon} />
                        </span>
                        <div>
                            <span>{item.title}</span>
                            <strong
                                style={item.style}
                                className={styles.textInfo}
                            >
                                {item.status && (
                                    <i className={`icon-${item.status}`} />
                                )}
                                {item.value}
                            </strong>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default ChallengePhaseInfo
