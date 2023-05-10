import { Dispatch, FC, SetStateAction, useState } from 'react'

import {
    CollapsiblePane,
    CourseOutline,
    LearnCourse,
    LearnUserCertificationProgress,
    TCACertificationProgressBox,
} from '../../lib'

import styles from './FccSidebar.module.scss'

interface FccSidebarProps {
    certification: string
    certificateProgress?: LearnUserCertificationProgress
    courseData?: LearnCourse
    courseDataReady: boolean
    currentStep: string
    refetchProgress: () => void
    userId?: number
}

const FccSidebar: FC<FccSidebarProps> = (props: FccSidebarProps) => {
    const [isOpen, setIsOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState(false)

    function handleToggle(isOutlineOpen: boolean): void {
        setIsOpen(isOutlineOpen)
        if (isOutlineOpen) {
            props.refetchProgress()
        }
    }

    function toggle(): void {
        setIsOpen(false)
    }

    return (
        <div className={styles['course-outline-pane']}>
            <CollapsiblePane
                title='Course Outline'
                onToggle={handleToggle}
                isOpen={isOpen}
            >
                <div className={styles['course-outline-wrap']}>
                    <TCACertificationProgressBox
                        userId={props.userId}
                        className={styles.tcaCertBanner}
                        fccCertificateId={props.certificateProgress?.fccCertificationId}
                        theme='sidebar'
                    />
                    <div className={styles['course-outline-title']}>
                        {props.courseData?.title}
                    </div>
                    <CourseOutline
                        certification={props.certification}
                        course={props.courseData}
                        ready={props.courseDataReady}
                        currentStep={props.currentStep}
                        progress={props.certificateProgress}
                        onItemNavigate={toggle}
                    />
                </div>
            </CollapsiblePane>
        </div>
    )
}

export default FccSidebar
