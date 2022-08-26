import { FC, ReactNode, useMemo } from 'react'

import { Button } from '../../../../../lib'
import {
    LearnCertification,
    LearningHat,
    MyCourseCompletedCard,
    MyCourseInProgressCard,
    UserCertificationCompleted,
    UserCertificationInProgress,
} from '../../../learn-lib'
import { LEARN_PATHS } from '../../../learn.routes'

import styles from './ProgressAction.module.scss'

interface ProgressActionProps {
    allCertifications: Array<LearnCertification>
    userCompletedCertifications: ReadonlyArray<UserCertificationCompleted>
    userInProgressCertifications: ReadonlyArray<UserCertificationInProgress>
}

const ProgressAction: FC<ProgressActionProps> = (props: ProgressActionProps) => {

    const {
        allCertifications,
        userCompletedCertifications: myCompletedCertifications,
        userInProgressCertifications: myInProgressCertifications,
    }: ProgressActionProps = props

    const allMyLearningsLink: ReactNode = (
        <span className={styles['title-link']}>
            <Button
                buttonStyle='link'
                label='See all my learning'
                route={LEARN_PATHS.myLearning}
            />
        </span>
    )

    const certificationsById: { [key: string]: LearnCertification } = useMemo(() => (
        allCertifications
            .reduce((certifs, certificate) => {
                certifs[certificate.id] = certificate
                return certifs
            }, {} as unknown as { [key: string]: LearnCertification })
    ), [allCertifications])

    // we only want to display the last course that was acted upon
    const mostRecentIsCompleted: boolean = myInProgressCertifications?.[0]?.updatedAt < myCompletedCertifications?.[0]?.updatedAt

    function renderInProgress(): JSX.Element {

        // if the most recently acted upon course is completed and not in progress,
        // or there are no coursse in progress, don't show this block
        if (mostRecentIsCompleted || !myInProgressCertifications.length) {
            return <></>
        }

        const courseToDisplay: UserCertificationInProgress = myInProgressCertifications[0]

        return (
            <>
                <div className={styles['title-line']}>
                    <h4 className='details'>In progress</h4>
                    <span className='mobile-hide'>
                        {allMyLearningsLink}
                    </span>
                </div>
                <MyCourseInProgressCard
                    certification={certificationsById[courseToDisplay.certificationId]}
                    key={courseToDisplay.certificationId}
                    completedPercentage={courseToDisplay.courseProgressPercentage / 100}
                    theme='minimum'
                    currentLesson={courseToDisplay.currentLesson}
                />
            </>
        )
    }

    function renderCompleted(): JSX.Element {

        // if the most recently acted upon course is in progress rather than completed,
        // or there are no completed courses, don't show this block
        if (!mostRecentIsCompleted || !myCompletedCertifications.length) {
            return <></>
        }

        const certToDisplay: UserCertificationCompleted = myCompletedCertifications[0]

        return (
            <>
                <div className={styles['title-line']}>
                    <div className={styles.title}>
                        <LearningHat />
                        <h4 className='details'>Congratulations!</h4>
                    </div>
                    {!myInProgressCertifications.length && (
                        <span className='mobile-hide'>
                            {allMyLearningsLink}
                        </span>
                    )}
                </div>
                <MyCourseCompletedCard
                    certification={certificationsById[certToDisplay.certificationId]}
                    key={certToDisplay.certificationId}
                    completed={certToDisplay.completedDate}
                />
            </>
        )
    }

    return (
        <>
            {renderInProgress()}
            {renderCompleted()}
            <span className='desktop-hide'>
                {allMyLearningsLink}
            </span>
        </>
    )
}

export default ProgressAction
