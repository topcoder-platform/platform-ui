import { FC, ReactNode } from 'react'

import styles from './StatusLabel.module.scss'
import classNames from 'classnames'

interface StatusLabelProps {
    icon: ReactNode
    hideLabel?: boolean
    label?: string
    score?: number
    status: 'pending' | 'failed' | 'passed' | 'failed-score'
}

const StatusLabel: FC<StatusLabelProps> = props => {

    return (
        <div className={styles.wrap}>
            {props.score && (
                <span className={classNames(styles[props.status], styles.score)}>{props.score}</span>
            )}
            {props.icon && (
                <span className={classNames(styles.icon, styles[props.status])}>
                    {props.icon}
                </span>
            )}
            {!props.hideLabel && props.label}
        </div>
    )
}

export default StatusLabel
