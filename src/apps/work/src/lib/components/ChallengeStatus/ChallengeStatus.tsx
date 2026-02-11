import { FC } from 'react'
import classNames from 'classnames'

import { CHALLENGE_STATUS } from '../../constants'
import { getStatusText } from '../../utils'

import styles from './ChallengeStatus.module.scss'

interface ChallengeStatusProps {
    status?: string
    statusText?: string
}

const statusClassMap: Record<string, string> = {
    [CHALLENGE_STATUS.ACTIVE]: styles.green,
    [CHALLENGE_STATUS.APPROVED]: styles.yellow,
    [CHALLENGE_STATUS.NEW]: styles.yellow,
    [CHALLENGE_STATUS.DRAFT]: styles.gray,
    [CHALLENGE_STATUS.COMPLETED]: styles.blue,
}

export const ChallengeStatus: FC<ChallengeStatusProps> = (
    props: ChallengeStatusProps,
) => {
    const normalizedStatus = (props.status || '').toUpperCase()
    const isCancelled = normalizedStatus.startsWith(CHALLENGE_STATUS.CANCELLED)

    return (
        <span
            className={classNames(
                styles.container,
                isCancelled ? styles.red : statusClassMap[normalizedStatus],
            )}
        >
            {props.statusText || getStatusText(normalizedStatus)}
        </span>
    )
}

export default ChallengeStatus
