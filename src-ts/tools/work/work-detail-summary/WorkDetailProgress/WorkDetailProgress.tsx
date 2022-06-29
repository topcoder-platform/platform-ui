import { FC } from 'react'

import '../../../../lib/styles/index.scss'
import { WorkProgress } from '../../work-lib'

import styles from './WorkDetailProgress.module.scss'
import { WorkDetailProgressItem } from './WorkDetailProgressItem'

const WorkDetailProgress: FC<WorkProgress> = (props: WorkProgress) => {

    const { steps, activeStepIndex }: WorkProgress = props

    const progressItems: Array<JSX.Element> = steps
        .map((item, index) =>
            <WorkDetailProgressItem
                {...item}
                activeStepIndex={activeStepIndex}
                currentIndex={index}
                key={index}
            />
        )

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
