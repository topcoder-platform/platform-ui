import { orderBy } from 'lodash'
import { FC, ReactNode, useMemo } from 'react'

import { Button } from '../../../../../lib'
import {
    LearnCertification,
    LearnUserCertificationProgress,
    MyCourseCompletedCard,
    MyCourseInProgressCard,
    UserCertificationCompleted,
    UserCertificationInProgress,
    UserCertificationProgressStatus,
} from '../../../learn-lib'
import { LEARN_PATHS } from '../../../learn.routes'
import { CardsSlider } from '../cards-slider'

import styles from './ProgressAction.module.scss'

interface ProgressActionProps {
    allCertifications: Array<LearnCertification>
    userCompletedCertifications: ReadonlyArray<UserCertificationCompleted>
    userInProgressCertifications: ReadonlyArray<UserCertificationInProgress>
}

function isCompleted(cert: LearnUserCertificationProgress): boolean {
    return cert.status === UserCertificationProgressStatus.completed
}

const USER_PROGRESS_MAX_SLIDES_COUNT: number = 8

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

    const recentlyUpdatedCertifications: Array<LearnUserCertificationProgress> = orderBy([
        ...myCompletedCertifications,
        ...myInProgressCertifications,
    ], 'updatedAt', 'desc').slice(0, USER_PROGRESS_MAX_SLIDES_COUNT)

    function renderInProgress(courseToDisplay: UserCertificationInProgress): JSX.Element {
        return (
            <MyCourseInProgressCard
                certification={certificationsById[courseToDisplay.certificationId]}
                key={courseToDisplay.certificationId}
                completedPercentage={courseToDisplay.courseProgressPercentage / 100}
                theme='minimum'
                currentLesson={courseToDisplay.currentLesson}
            />
        )
    }

    function renderCompleted(certToDisplay: UserCertificationCompleted): JSX.Element {
        return (
            <MyCourseCompletedCard
                certification={certificationsById[certToDisplay.certificationId]}
                key={certToDisplay.certificationId}
                completed={certToDisplay.completedDate}
            />
        )
    }

    function renderCertificateCards(): Array<JSX.Element> {
        if (!recentlyUpdatedCertifications.length) {
            return []
        }

        return recentlyUpdatedCertifications.map(cert => (
            isCompleted(cert)
                ? renderCompleted(cert as UserCertificationCompleted)
                : renderInProgress(cert as UserCertificationInProgress)
        ))
    }

    return (
        <>
            <div className={styles['title-line']}>
                <h4 className='details'>My progress</h4>
                <span className='mobile-hide'>
                    {allMyLearningsLink}
                </span>
            </div>
            <CardsSlider>
                {renderCertificateCards()}
            </CardsSlider>
            <span className='desktop-hide'>
                {allMyLearningsLink}
            </span>
        </>
    )
}

export default ProgressAction
