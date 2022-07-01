import { FC, ReactNode, useContext, useMemo } from 'react'

import { Button, profileContext, ProfileContextData } from '../../../../lib'
import {
    LearnCertification,
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
    certificates: Array<LearnCertification>
}

const ProgressBlock: FC<ProgressBlockProps> = (props: ProgressBlockProps) => {
    const { profile }: ProfileContextData = useContext(profileContext)

    const { completed, inProgress }: MyCertificationsProviderData = useMyCertifications(profile?.userId)
    const isInit: boolean = !inProgress.length && !completed.length

    const certificatesById: {[key: string]: LearnCertification} = useMemo(() => (
        props.certificates.reduce((certifs, certificate) => {
            certifs[certificate.id] = certificate
            return certifs
}, {} as unknown as {[key: string]: LearnCertification})
    ), [props.certificates])

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
                    {inProgress.map((certifProgress) => (
                        <MyCourseInProgressCard
                            certification={certificatesById[certifProgress.certificationId]}
                            key={certifProgress.certificationId}
                            completedPercentage={certifProgress.completedPercentage}
                            theme='minimum'
                            currentLesson={certifProgress.currentLesson}
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
                            certification={certificatesById[certif.certificationId]}
                            key={certif.certificationId}
                            completed={certif.completedDate!}
                        />
                    ))}
                </>
            )}
        </div>
    )
}

export default ProgressBlock
