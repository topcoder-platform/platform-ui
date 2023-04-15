import { FC, ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { IconSolid, ProgressBar, Button } from '~/libs/ui'

import {
    clearFCCCertificationTitle,
    CompletionTimeRange,
    LearnCertification,
    LearnCourse,
    LearnLevelIcon,
    LearnUserCertificationProgress,
    ProvidersLogoList,
    TCACertification,
    TCACertificationCompletionTimeRange,
    TCACertificationLearnLevel,
    TCACertificationProviderBase,
    useHoursEstimateToRange,
    UserCertificationProgressStatus,
} from '../../../../lib'
import {
    getCertificatePath,
    getCoursePath,
    getLessonPathFromCurrentLesson,
} from '../../../../learn.routes'
import CurriculumCard from '../CurriculumCard'

import styles from './CourseCard.module.scss'

interface CourseCardProps {
    certification: LearnCertification
    course?: LearnCourse
    progress: LearnUserCertificationProgress
    learnerLevel: TCACertificationLearnLevel
    provider: string
    isEnrolled: boolean
    tcaCertification: TCACertification
}

const CourseCard: FC<CourseCardProps> = (props: CourseCardProps) => {
    function renderCta(): ReactNode {
        switch (props.progress?.status) {
            case UserCertificationProgressStatus.completed:
                return (
                    <>
                        <Link
                            to={getCoursePath(
                                props.provider,
                                props.certification.certification,
                            )}
                            state={{ tcaCertInfo: {
                                dashedName: props.tcaCertification.dashedName,
                                title: props.tcaCertification.title,
                            } }}
                        >
                            <Button
                                secondary
                                size='sm'
                                label='Details'
                            />
                        </Link>
                        <Link
                            to={getCertificatePath(
                                props.provider,
                                props.certification.certification,
                            )}
                        >
                            <Button
                                primary
                                size='sm'
                                label='View Certificate'
                            />
                        </Link>
                    </>
                )
            case UserCertificationProgressStatus.inProgress:
                return (
                    <Link
                        to={getLessonPathFromCurrentLesson(
                            props.provider,
                            props.certification.certification,
                            props.progress?.currentLesson,
                        )}
                        state={{ tcaCertInfo: {
                            dashedName: props.tcaCertification.dashedName,
                            title: props.tcaCertification.title,
                        } }}
                    >
                        <Button
                            primary
                            size='sm'
                            label='Resume'
                        />
                    </Link>
                )
            default:
                return (
                    <Link
                        to={getCoursePath(
                            props.provider,
                            props.certification.certification,
                        )}
                        state={{ tcaCertInfo: {
                            dashedName: props.tcaCertification.dashedName,
                            title: props.tcaCertification.title,
                        } }}
                    >
                        <Button
                            primary
                            size='sm'
                            label='Details'
                        />
                    </Link>
                )
        }
    }

    const completionTimeRange: TCACertificationCompletionTimeRange = useHoursEstimateToRange(
        props.course?.estimatedCompletionTimeValue ?? 0,
    )

    return (
        <CurriculumCard
            badgeTrackType={props.certification.certificationCategory.track ?? 'DEV'}
            title={clearFCCCertificationTitle(props.certification.title)}
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
                            <span className='quote-small'>
                                {props.course?.modules.length}
                                {' modules'}
                            </span>
                        </li>
                        <li className={styles.stat}>
                            <span className={styles.icon}>
                                <IconSolid.ClockIcon />
                            </span>
                            <span className='quote-small'>
                                <CompletionTimeRange range={completionTimeRange} />
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
