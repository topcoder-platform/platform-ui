import { FC, useCallback } from 'react'
import classNames from 'classnames'

import { LoadingSpinner } from '../../../../lib'
import {
    LearnCourse,
    LearnLesson,
    LearnModule,
    LearnUserCertificationProgress,
} from '..'
import { getLessonPathFromModule } from '../../learn.routes'

import { CollapsibleItem } from './collapsible-item'
import styles from './CourseOutline.module.scss'

interface CourseOutlineProps {
    certification: string
    course?: LearnCourse
    currentStep?: string
    onItemNavigate: (item: LearnLesson) => void
    progress?: LearnUserCertificationProgress
    ready?: boolean
}

const CourseOutline: FC<CourseOutlineProps> = (props: CourseOutlineProps) => {

    const lessonPath: (course: LearnCourse, module: LearnModule, lesson: LearnLesson) => string
        = useCallback((course: LearnCourse, module: LearnModule, lesson: LearnLesson) => getLessonPathFromModule(
            course.resourceProvider.name,
            props.certification,
            module.key,
            lesson.dashedName,
        ), [props.certification])

    function getItemKeyFn(module: LearnModule): (l: LearnLesson) => string {
        return function getItemKey(lesson: LearnLesson): string {
            return `${module.dashedName}/${lesson.dashedName}`
        }
    }

    function getItemPathFn(module: LearnModule): (l: LearnLesson) => string {
        return function getItemPath(lesson: LearnLesson): string {
            return (props.course ? lessonPath(props.course, module, lesson) : '')
        }
    }

    return (
        <div className={classNames(styles.wrap, 'course-outline-wrap')}>

            <LoadingSpinner hide={props.ready !== false} />

            {props.course && (
                <div className={classNames(styles.content, 'content')}>
                    {props.course.modules.map(module => (
                        <CollapsibleItem
                            active={props.currentStep}
                            duration={module.estimatedCompletionTimeValue}
                            durationUnits={module.estimatedCompletionTimeUnits}
                            moduleKey={module.key}
                            itemId={getItemKeyFn(module)}
                            items={module.lessons}
                            key={module.key}
                            lessonsCount={module.lessons.length}
                            path={getItemPathFn(module)}
                            progress={props.progress?.moduleProgresses}
                            shortDescription={module.introCopy}
                            title={module.name}
                            onItemClick={props.onItemNavigate}
                            isAssessment={module.isAssessment}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default CourseOutline
