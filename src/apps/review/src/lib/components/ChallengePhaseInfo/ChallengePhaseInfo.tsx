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
    variant?: 'active' | 'past'
}

export const ChallengePhaseInfo: FC<Props> = (props: Props) => {
    const { myChallengeRoles }: useRoleProps = useRole()
    const PROGRESS_TYPE = 'progress'
    const uiItems = useMemo(() => {
        const data = props.challengeInfo
        const variant = props.variant ?? 'active'

        const getChallengeEndDateValue = (): string => {
            if (data.endDateString) {
                return data.endDateString
            }

            if (data.endDate instanceof Date) {
                return data.endDate.toLocaleString()
            }

            if (typeof data.endDate === 'string') {
                return data.endDate
            }

            return 'N/A'
        }

        const items: any[] = []

        if (variant === 'active') {
            items.push({
                icon: 'icon-review',
                title: 'Phase',
                value: data.currentPhase || 'N/A',
            })
        }

        items.push({
            icon: 'icon-handle',
            title: 'My Role',
            value: (
                <div className={styles.blockMyRoles}>
                    {myChallengeRoles.map(item => (
                        <span key={item}>{item}</span>
                    ))}
                </div>
            ),
        })

        items.push({
            icon: 'icon-event',
            title: variant === 'past' ? 'Challenge End Date' : 'Phase End Date',
            value: variant === 'past'
                ? getChallengeEndDateValue()
                : data.currentPhaseEndDateString || 'N/A',
        })

        if (variant === 'active') {
            items.push({
                icon: 'icon-timer',
                status: data.timeLeftStatus,
                style: {
                    color: data.timeLeftColor,
                },
                title: 'Time Left',
                value: data.timeLeft || 'N/A',
            })

            items.push({
                title: 'Review Progress',
                type: PROGRESS_TYPE,
                value: props.reviewProgress,
            })
        }

        return items
    }, [
        myChallengeRoles,
        props.challengeInfo,
        props.reviewProgress,
        props.variant,
    ])
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
