import { FC, useState } from 'react'

import { CollapsiblePane, CourseOutline, LearnCourse, LearnUserCertificationProgress } from '../../learn-lib'

import styles from './FccSidebar.module.scss'

interface FccSidebarProps {
    certificateProgress?: LearnUserCertificationProgress
    courseData?: LearnCourse
    courseDataReady: boolean
    currentStep: string
    refetchProgress: () => void
}

const FccSidebar: FC<FccSidebarProps> = (props: FccSidebarProps) => {
    const [isOpen, setIsOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState(false)

    const handleToggle: (isOutlineOpen: boolean) => void = (isOutlineOpen: boolean) => {
        setIsOpen(isOutlineOpen)
        if (isOutlineOpen) {
            props.refetchProgress()
        }
    }

    return (
        <div className={styles['course-outline-pane']}>
            <CollapsiblePane
                title='Course Outline'
                onToggle={handleToggle}
                isOpen={isOpen}
            >
                <div className={styles['course-outline-wrap']}>
                    <div className={styles['course-outline-title']}>
                        {props.courseData?.title}
                    </div>
                    <CourseOutline
                        course={props.courseData}
                        ready={props.courseDataReady}
                        currentStep={props.currentStep}
                        progress={props.certificateProgress}
                        onItemNavigate={() => setIsOpen(false)}
                    />
                </div>
            </CollapsiblePane>
        </div>
    )
}

export default FccSidebar
