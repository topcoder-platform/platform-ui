import classNames from 'classnames'
import { FC, useCallback } from 'react'

import { LoadingSpinner } from '../../../../lib'
import {
    LearnCourse,
    LearnLesson,
    LearnModule,
    LearnUserCertificationProgress,
} from '../../learn-lib'
import { getLessonPathFromModule } from '../../learn.routes'

import { CollapsibleItem } from './collapsible-item'
import styles from './CourseOutline.module.scss'

interface CourseOutlineProps {
    course?: LearnCourse
    currentStep?: string
    onItemNavigate: (item: LearnLesson) => void
    progress?: LearnUserCertificationProgress
    ready?: boolean
}

const CourseOutline: FC<CourseOutlineProps> = (props: CourseOutlineProps) => {

    const lessonPath: (course: LearnCourse, module: LearnModule, lesson: LearnLesson) => string
        = useCallback((course: LearnCourse, module: LearnModule, lesson: LearnLesson) => {
            return getLessonPathFromModule(
                course.provider,
                course.certification,
                module.key,
                lesson.dashedName,
            )
        }, [])

    return (
        <div className={classNames(styles['wrap'], 'course-outline-wrap')}>

            <LoadingSpinner hide={props.ready !== false} />

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
                            path={(it: any) => props.course ? lessonPath(props.course, module, it) : ''}
                            progress={props.progress?.modules}
                            shortDescription={module.meta.introCopy}
                            title={module.meta.name}
                            onItemClick={props.onItemNavigate}
                            isAssessment={module.meta.isAssessment}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default CourseOutline
