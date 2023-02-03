import { FC, ReactNode } from 'react'

import { Button, IconSolid, ProgressBar } from '../../../../../../lib'
import {
    LearnCertification,
    LearnLevelIcon,
    LearnUserCertificationProgress,
    ProvidersLogoList,
    TCACertificationLearnLevel,
    TCACertificationProviderBase,
    UserCertificationProgressStatus,
} from '../../../../learn-lib'
import { getCertificatePath, getCoursePath } from '../../../../learn.routes'
import CurriculumCard from '../CurriculumCard'

import styles from './CourseCard.module.scss'

interface CourseCardProps {
    certification: LearnCertification
    progress: LearnUserCertificationProgress
    learnerLevel: TCACertificationLearnLevel
    provider: string
    isEnrolled: boolean
}

const CourseCard: FC<CourseCardProps> = (props: CourseCardProps) => {
    function renderCta(): ReactNode {
        switch (props.progress?.status) {
            case UserCertificationProgressStatus.completed:
                return (
                    <>
                        <Button
                            buttonStyle='secondary'
                            size='xs'
                            label='Details'
                            route={getCoursePath(
                                props.provider,
                                props.certification.certification,
                            )}
                        />
                        <Button
                            buttonStyle='primary'
                            size='xs'
                            label='View Certificate'
                            route={getCertificatePath(
                                props.provider,
                                props.certification.certification,
                            )}
                        />
                    </>
                )
            case UserCertificationProgressStatus.inProgress:
                return (
                    <Button
                        buttonStyle='primary'
                        size='xs'
                        label='Resume'
                        route={getCoursePath(
                            props.provider,
                            props.certification.certification,
                        )}
                    />
                )
            default:
                return (
                    <Button
                        buttonStyle='secondary'
                        size='xs'
                        label='Details'
                        route={getCoursePath(
                            props.provider,
                            props.certification.certification,
                        )}
                    />
                )
        }
    }

    return (
        <CurriculumCard
            badgeTrackType={props.certification.trackType ?? 'DEV'}
            title={props.certification.title ?? 'Responsive Web Design Certification'}
            cta={renderCta()}
            status={props.isEnrolled ? props.progress?.status : undefined}
            content={(
                <>
                    <ul className={styles.stats}>
                        <li className={styles.stat}>
                            <span className={styles.icon}>
                                <LearnLevelIcon level={props.learnerLevel} />
                            </span>
                            <span className='quote-small'>{props.learnerLevel}</span>
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
                            <span className='quote-small'>
                                {props.certification.completionHours}
                                {' hours'}
                            </span>
                        </li>
                    </ul>
                    <ProvidersLogoList
                        className={styles.providers}
                        label='by'
                        providers={[{ name: props.provider }] as unknown as TCACertificationProviderBase[]}
                    />
                    {props.progress?.status === UserCertificationProgressStatus.inProgress && (
                        <div className={styles.progress}>
                            <ProgressBar
                                progress={(props.progress.courseProgressPercentage ?? 0) / 100}
                            />
                        </div>
                    )}
                </>
            )}
        />
    )
}

export default CourseCard
