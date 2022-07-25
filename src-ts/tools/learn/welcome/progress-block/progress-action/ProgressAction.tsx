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
    userCompletedCertifications: Array<UserCertificationCompleted>
    userInProgressCertifications: Array<UserCertificationInProgress>
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

    return (
        <>
            {!!myInProgressCertifications.length && (
                <div className={styles['title-line']}>
                    <h4 className='details'>In progress</h4>
                    <span className='mobile-hide'>
                        {allMyLearningsLink}
                    </span>
                </div>
            )}
            {myInProgressCertifications
                .map((cert) => (
                    <MyCourseInProgressCard
                        certification={certificationsById[cert.certificationId]}
                        key={cert.certificationId}
                        completedPercentage={cert.courseProgressPercentage / 100}
                        theme='minimum'
                        currentLesson={cert.currentLesson}
                    />
                ))}
            {!!myCompletedCertifications.length && (
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
            )}
            {myCompletedCertifications
                .map((cert) => (
                    <MyCourseCompletedCard
                        certification={certificationsById[cert.certificationId]}
                        key={cert.certificationId}
                        completed={cert.completedDate}
                    />
                ))}
        </>
    )
}

export default ProgressAction
