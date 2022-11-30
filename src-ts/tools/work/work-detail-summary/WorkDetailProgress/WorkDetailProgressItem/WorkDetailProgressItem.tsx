import { FC } from 'react'
import classNames from 'classnames'

import { textFormatDateLocaleShortString } from '../../../../../lib'
import { WorkProgressStep } from '../../../work-lib'

import styles from './WorkDetailProgressItem.module.scss'

interface WorkDetailProgressItemProps extends WorkProgressStep {
    activeStepIndex: number
    currentIndex: number
}

const WorkDetailProgressItem: FC<WorkDetailProgressItemProps> = (props: WorkDetailProgressItemProps) => {

    function getClasses(): string {
        return classNames(
            props.currentIndex === props.activeStepIndex ? styles.select : undefined,
            props.currentIndex < props.activeStepIndex ? styles.active : undefined,
        )
    }

    return (
        <div className={classNames(styles['progress-bar-list-item'], getClasses())}>

            <span className={classNames(styles.dots, 'body-medium-medium')}>
                {props.currentIndex + 1}
            </span>

            <div className={styles.label}>
                <span className={classNames(styles.name, 'large-subtitle-bold')}>
                    {props.name}
                </span>
                <span className={classNames(styles.date, 'body-small-medium')}>
                    {textFormatDateLocaleShortString(props?.date)}
                </span>
            </div>

        </div>
    )
}

export default WorkDetailProgressItem
