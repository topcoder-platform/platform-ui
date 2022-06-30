import { FC, ReactNode } from 'react'

import { Button } from '../../../../lib'
import {
    LearningHat,
    MyCertificationsProviderData,
    MyCourseCompletedCard,
    MyCourseInProgressCard,
    useMyCertifications
} from '../../learn-lib'
import { LEARN_PATHS } from '../../learn.routes'

import InitState from './init-state/InitState'
import styles from './ProgressBlock.module.scss'

interface ProgressBlockProps {
}

const ProgressBlock: FC<ProgressBlockProps> = (props: ProgressBlockProps) => {
    const { completed, inProgress }: MyCertificationsProviderData = useMyCertifications()
    const isInit: boolean = !inProgress.length && !completed.length

    const allMyLearningsLink: ReactNode = (
        <span className={styles['title-link']}>
            <Button
                buttonStyle='link'
                label='See all my learning'
                route={LEARN_PATHS.myLearning}
            />
        </span>
    )

    return (
        <div className={styles['wrap']}>
            {isInit && <InitState />}
            {!isInit && (
                <>
                    {!!inProgress.length && (
                        <div className={styles['title-line']}>
                            <h4 className='details'>In progress</h4>
                            {allMyLearningsLink}
                        </div>
                    )}
                    {inProgress.map((certif) => (
                        <MyCourseInProgressCard
                            certification={certif}
                            key={certif.key}
                            progress={certif.progress}
                            theme='minimum'
                        />
                    ))}
                    {!!completed.length && (
                        <div className={styles['title-line']}>
                            <LearningHat />
                            <h4 className='details'>Congratulations!</h4>
                            {!inProgress.length && allMyLearningsLink}
                        </div>
                    )}
                    {completed.map((certif) => (
                        <MyCourseCompletedCard
                            certification={certif}
                            key={certif.key}
                            completed={certif.progress.completedDate!}
                        />
                    ))}
                </>
            )}
        </div>
    )
}

export default ProgressBlock
