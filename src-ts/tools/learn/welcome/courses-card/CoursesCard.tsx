import { FC, memo, ReactNode } from 'react'
import classNames from 'classnames'

import { Button, FccLogoBlackSvg, IconSolid, ProgressBar } from '../../../../lib'
import {
    CompletionTimeRange,
    CourseBadge,
    LearnCertification,
    LearnLevelIcon,
    LearnUserCertificationProgress,
    SkillTags,
    TCACertificationCompletionTimeRange,
    useHoursEstimateToRange,
    UserCertificationProgressStatus,
} from '../../learn-lib'
import { getCertificatePath, getCoursePath, getLessonPathFromCurrentLesson } from '../../learn.routes'

import styles from './CoursesCard.module.scss'

interface CoursesCardProps {
    certification: LearnCertification
    progress?: LearnUserCertificationProgress
}

const EXCERPT_TEXT_LEN: number = 95

const CoursesCard: FC<CoursesCardProps> = (props: CoursesCardProps) => {
    const desc: string = props.certification.description?.slice(0, EXCERPT_TEXT_LEN)
    const descLength: number = props.certification.description?.length
    const courseEnabled: boolean = props.certification.state === 'active'
    const isCompleted: boolean = props.progress?.status === UserCertificationProgressStatus.completed
    const isInProgress: boolean = props.progress?.status === UserCertificationProgressStatus.inProgress

    function renderCtaBtns(status?: UserCertificationProgressStatus): ReactNode {
        const provider: string = props.certification.resourceProvider.name
        const certificationCourse: string = props.certification.certification
        const currentLesson: string | undefined = props.progress?.currentLesson

        const resumeRoute: string = getLessonPathFromCurrentLesson(provider, certificationCourse, currentLesson)
        const detailsRoute: string = getCoursePath(provider, certificationCourse)
        const certifRoute: string = getCertificatePath(provider, certificationCourse)

        switch (status) {
            case UserCertificationProgressStatus.completed:
                return (
                    <div className={styles.completedCTAs}>
                        <div>
                            <Button buttonStyle='primary' size='xs' label='View Certificate' route={certifRoute} />
                            <Button buttonStyle='secondary' size='xs' label='Details' route={detailsRoute} />

                        </div>
                    </div>
                )
            case UserCertificationProgressStatus.inProgress:
                return <Button buttonStyle='primary' size='xs' label='Resume' route={resumeRoute} />
            default:
                return <Button buttonStyle='secondary' size='xs' label='Details' route={detailsRoute} />
        }
    }

    const completionTimeRange: TCACertificationCompletionTimeRange = useHoursEstimateToRange(
        props.certification.course.estimatedCompletionTimeValue,
    )

    return (
        <div className={classNames(styles.wrap, !courseEnabled && 'soon', isCompleted && styles.completed)}>
            <div className={styles.cardHeader}>
                <CourseBadge type={props.certification.certificationCategory.track ?? 'DEV'} />
                <div className={styles.cardHeaderTitleWrap}>
                    <p className='body-medium-medium'>{props.certification.title}</p>
                    <div className={styles.subTitleWrap}>
                        <LearnLevelIcon level={props.certification.learnerLevel} />
                        <span className={classNames('body-small', styles.infoText)}>
                            {props.certification.learnerLevel}
                        </span>
                        <IconSolid.DocumentTextIcon width={16} height={16} />
                        <em>
                            {props.certification.moduleCount}
                            {' modules'}
                        </em>
                        <IconSolid.ClockIcon width={16} height={16} />
                        <em>
                            <CompletionTimeRange range={completionTimeRange} />
                        </em>
                    </div>
                </div>
            </div>

            <div className={styles.cardHeaderDividerWrap}>
                {(isInProgress || isCompleted) && (
                    <ProgressBar
                        progress={(props.progress?.courseProgressPercentage ?? 0) / 100}
                        track={props.certification.certificationCategory.track}
                    />
                )}
                {!isInProgress && !isCompleted && <div className={styles.cardHeaderDivider} />}
            </div>

            <p>
                {desc}
                {descLength > EXCERPT_TEXT_LEN ? '...' : ''}
            </p>

            <SkillTags
                courseKey={props.certification.course.key}
                expandCount={2}
                skills={props.certification.course.skills}
                theme={isCompleted ? 'gray' : 'white'}
            />

            <div className={styles.cardBody}>
                <div className={styles.certProvider}>
                    {'by '}
                    <FccLogoBlackSvg />
                </div>
            </div>

            <div className={styles.cardBottom}>
                {courseEnabled ? (
                    renderCtaBtns(props.progress?.status)
                ) : (
                    <h4 className='details'>Coming Soon</h4>
                )}
            </div>
        </div>
    )
}

export default memo(CoursesCard)
