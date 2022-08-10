import classNames from 'classnames'
import { FC, ReactNode } from 'react'

import { IconSolid } from '../../../../../lib'

import styles from './StepIcon.module.scss'

interface StepIconProps {
    active?: boolean
    completed?: boolean
    index: string
    label?: string
}

const StepIcon: FC<StepIconProps> = (props: StepIconProps) => {
    const classnames: string = classNames(
        styles['step-wrap'],
        props.completed && 'completed',
        props.active && 'active',
        props.label && props.completed && 'has-icon',
    )

    function getIconContent(): ReactNode {
        return (
            <>
                {props.label && props.completed && (
                    <IconSolid.CheckCircleIcon />
                )}

                {!props.label && (
                    <span className='small-tab-bold'>
                        {props.index}
                    </span>
                )}
            </>
        )
    }

    return (
        <div className={classnames}>
            <span className={styles['icon']}>
                {getIconContent()}
            </span>
            {props.label && (
                <span className={classNames(styles['label'], 'body-small')}>
                    {props.label}
                </span>
            )}
        </div>
    )
}

export default StepIcon
