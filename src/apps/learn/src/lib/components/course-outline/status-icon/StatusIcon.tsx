import { FC, ReactNode, useMemo } from 'react'
import classNames from 'classnames'

import { IconOutline, IconSolid } from '~/libs/ui'

import styles from './StatusIcon.module.scss'

interface StatusIconProps {
    completed?: boolean
    partial?: boolean
}

const StatusIcon: FC<StatusIconProps> = (props: StatusIconProps) => {
    const classes: string = classNames(
        styles.checkmark,
        'status-checkbox',
        props.completed && 'completed',
        props.partial && 'partial',
    )

    const icon: ReactNode = useMemo(() => {
        if (props.completed) {
            return <IconSolid.CheckCircleIcon />
        }

        if (props.partial) {
            return <IconOutline.ClockIcon />
        }

        return <IconOutline.DotsCircleHorizontalIcon />
    }, [props.completed, props.partial])

    return (
        <div className={classes}>
            {icon}
        </div>
    )
}

export default StatusIcon
