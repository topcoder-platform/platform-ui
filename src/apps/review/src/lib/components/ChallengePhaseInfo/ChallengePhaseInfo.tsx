/**
 * Challenge Phase Info.
 */
import { FC, useMemo } from 'react'
import classNames from 'classnames'

import { ChallengeInfo } from '../../models'

import styles from './ChallengePhaseInfo.module.scss'

interface Props {
    className?: string
    challengeInfo: ChallengeInfo
}

export const ChallengePhaseInfo: FC<Props> = (props: Props) => {
    const uiItems = useMemo(() => {
        const data = props.challengeInfo
        return [
            {
                title: 'Phase',
                value: data.currentPhase,
            },
            {
                title: 'Phase End Date',
                value: data.currentPhaseEndDateString,
            },
            {
                style: {
                    color: data.timeLeftColor,
                },
                title: 'Time Left',
                value: data.timeLeft,
            },
            {
                title: 'Review Progress',
                value: data.reviewProgress
                    ? `${data.reviewProgress}% Completed`
                    : '-',
            },
        ]
    }, [props.challengeInfo])
    return (
        <div className={classNames(styles.container, props.className)}>
            {uiItems.map(item => (
                <div className={styles.blockItem} key={item.title}>
                    <strong>
                        {item.title}
                        :
                    </strong>
                    <span style={item.style}>{item.value}</span>
                </div>
            ))}
        </div>
    )
}

export default ChallengePhaseInfo
