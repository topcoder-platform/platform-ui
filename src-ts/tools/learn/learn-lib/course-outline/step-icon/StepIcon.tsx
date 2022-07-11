import classNames from 'classnames'
import { FC } from 'react'

import styles from './StepIcon.module.scss'

interface StepIconProps {
    active?: boolean
    completed?: boolean
    index: number
}

const StepIcon: FC<StepIconProps> = (props: StepIconProps) => {
    const classnames: string = classNames(
        styles['step-wrap'],
        props.completed && 'completed',
        props.active && 'active',
    )
    return (
        <div className={classnames}>
            <span className='small-tab-bold'>
                {props.index}
            </span>
        </div>
    )
}

export default StepIcon
