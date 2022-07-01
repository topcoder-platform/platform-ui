import classNames from 'classnames'
import { FC, useCallback } from 'react'

import { LoadingSpinner } from '../../../../lib'
import {
    LearnCourse,
    LearnLesson,
    LearnModule,
    LearnMyCertificationProgress,
} from '../../learn-lib'
import { getFccLessonPath } from '../../learn.routes'

import { CollapsibleItem } from './collapsible-item'
import styles from './CourseOutline.module.scss'

interface CourseOutlineProps {
    course?: LearnCourse
    currentStep?: string
    progress?: LearnMyCertificationProgress
    ready?: boolean
}

const CourseOutline: FC<CourseOutlineProps> = (props: CourseOutlineProps) => {

    const lessonPath: (course: LearnCourse, module: LearnModule, lesson: LearnLesson) => string = useCallback((course: LearnCourse, module: LearnModule, lesson: LearnLesson) => {
        const path: string = [
            course && `course=${encodeURIComponent(course.certification)}`,
            module && `module=${encodeURIComponent(module.key)}`,
            lesson && `lesson=${encodeURIComponent(lesson.dashedName)}`,
        ].filter(Boolean).join('&')

        return getFccLessonPath(
            course.provider,
            course.certification,
            module.key,
            lesson.dashedName,
        )
    }, [props.course])

    return (
        <div className={classNames(styles['wrap'], 'course-outline-wrap')}>
            {props.ready === false && <LoadingSpinner />}

            {props.course && (
                <div className={classNames(styles['content'], 'content')}>
                    {props.course.modules.map((module) => (
                        <CollapsibleItem
                            active={props.currentStep}
                            duration={module.meta.estimatedCompletionTime}
                            moduleKey={module.key}
                            itemId={(it: any) => `${module.meta.dashedName}/${it.dashedName}`}
                            items={module.lessons}
                            key={module.key}
                            lessonsCount={module.lessons.length}
                            path={(it: any) => lessonPath(props.course!, module, it)}
                            progress={props.progress?.modules}
                            shortDescription={module.meta.introCopy}
                            title={module.meta.name}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default CourseOutline
