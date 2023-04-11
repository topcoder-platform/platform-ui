import { FC } from 'react'

import { WorkProgress } from '../../../../lib'

import { WorkDetailProgressItem } from './WorkDetailProgressItem'
import styles from './WorkDetailProgress.module.scss'

const WorkDetailProgress: FC<WorkProgress> = (props: WorkProgress) => {

    const progressItems: Array<JSX.Element> = props.steps
        .map((item, index) => (
            <WorkDetailProgressItem
                {...item}
                activeStepIndex={props.activeStepIndex}
                currentIndex={index}
                key={index as any}
            />
        ))

    return (
        <div className={styles['progress-container']}>

            <h3>Progress</h3>

            <div className={styles.progress}>
                {progressItems}
            </div>

        </div>
    )
}

export default WorkDetailProgress
