import { FC, ReactNode } from 'react'
import classNames from 'classnames'

import styles from './StatusLabel.module.scss'

interface StatusLabelProps {
    icon: ReactNode
    hideLabel?: boolean
    label?: string
    score?: number
    status: 'pending' | 'failed' | 'passed' | 'failed-score'
}

const StatusLabel: FC<StatusLabelProps> = props => (
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

export default StatusLabel
