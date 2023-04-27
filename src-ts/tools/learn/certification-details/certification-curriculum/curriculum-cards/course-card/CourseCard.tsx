import { FC, ReactNode } from 'react'

import { BreadcrumbItemModel, Button, IconSolid, ProgressBar } from '../../../../../../lib'
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
} from '../../../../learn-lib'
import {
    getCertificatePath,
    getCoursePath,
    getLessonPathFromCurrentLesson,
    getTCACertificationPath,
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

        const routeState: { tcaCertInfo: BreadcrumbItemModel } = {
            tcaCertInfo: {
                name: props.tcaCertification.title,
                url: getTCACertificationPath(props.tcaCertification.dashedName),
            },
        }

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
                            routeState={routeState}
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
                        route={getLessonPathFromCurrentLesson(
                            props.provider,
                            props.certification.certification,
                            props.progress?.currentLesson,
                        )}
                        routeState={routeState}
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
                        routeState={routeState}
                    />
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
