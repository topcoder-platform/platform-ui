import { FC, ReactNode } from 'react'

import { Button, IconSolid, ProgressBar } from '../../../../../../lib'
import {
    LearnCertification,
    LearnLevelIcon,
    LearnUserCertificationProgress,
    ProvidersLogoList,
    UserCertificationProgressStatus,
} from '../../../../learn-lib'
import { getCertificatePath, getCoursePath } from '../../../../learn.routes'
import CurriculumCard from '../CurriculumCard'

import styles from './CourseCard.module.scss'

interface CourseCardProps {
    certification: LearnCertification
    progress: LearnUserCertificationProgress
}

const CourseCard: FC<CourseCardProps> = (props: CourseCardProps) => {
    function renderCta(): ReactNode {
        switch (props.progress.status) {
            case UserCertificationProgressStatus.completed:
                return (
                    <Button
                        buttonStyle='primary'
                        size='xs'
                        label='View Certificate'
                        route={getCertificatePath(
                            props.certification.providerName,
                            props.certification.certification,
                        )}
                    />
                )
            case UserCertificationProgressStatus.inProgress:
                return (
                    <></>
                )
            default:
                return (
                    <Button
                        buttonStyle='secondary'
                        size='xs'
                        label='Details'
                        route={getCoursePath(
                            props.certification.providerName,
                            props.certification.certification,
                        )}
                    />
                )
        }
    }

    return (
        <CurriculumCard
            bradgeTrackType={props.certification.trackType ?? 'DEV'}
            title={props.certification.title ?? 'Responsive Web Design Certification'}
            cta={renderCta()}
            content={(
                <>
                    <ul className={styles.stats}>
                        <li className={styles.stat}>
                            <span className={styles.icon}>
                                <LearnLevelIcon level='Beginner' />
                            </span>
                            <span className='quote-small'>Beginner</span>
                        </li>
                        <li className={styles.stat}>
                            <span className={styles.icon}>
                                <IconSolid.DocumentTextIcon />
                            </span>
                            <span className='quote-small'>4 modules</span>
                        </li>
                        <li className={styles.stat}>
                            <span className={styles.icon}>
                                <IconSolid.ClockIcon />
                            </span>
                            <span className='quote-small'>2 weeks</span>
                        </li>
                    </ul>
                    <ProvidersLogoList
                        className={styles.providers}
                        label='by'
                        providers={['freecodecamp']}
                    />
                    {props.progress.status === UserCertificationProgressStatus.inProgress && (
                        <div className={styles.progress}>
                            <ProgressBar
                                progress={props.progress.courseProgressPercentage / 100}
                            />
                        </div>
                    )}
                </>
            )}
        />
    )
}

export default CourseCard
