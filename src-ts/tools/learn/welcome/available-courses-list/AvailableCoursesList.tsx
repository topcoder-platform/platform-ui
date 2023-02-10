import { Dictionary } from 'lodash'
import { FC, Fragment, ReactNode } from 'react'
import classNames from 'classnames'

import { LearnCertification, LearnUserCertificationProgress } from '../../learn-lib'
import { CoursesCard } from '../courses-card'

import styles from './AvailableCoursesList.module.scss'

interface AvailableCoursesListProps {
    certsByCategory: Dictionary<Array<LearnCertification>>
    certifications: ReadonlyArray<LearnCertification>
    certificationsGroups: Array<string>
    selectedCategory: string
    certificationsProgresses: ReadonlyArray<LearnUserCertificationProgress>
}

const AvailableCoursesList: FC<AvailableCoursesListProps> = (props: AvailableCoursesListProps) => {
    const certificationsCount: number = (
        (props.certsByCategory[props.selectedCategory] ?? props.certifications).length
    )

    const renderCertificationGroup: (category: string) => ReactNode = (category: string) => (
        <Fragment key={category}>
            <h4 className={classNames('details', styles['courses-group-title'])}>
                {category}
            </h4>

            <div className={styles.coursesList}>
                {props.certsByCategory[category]
                    .map(certification => (
                        <CoursesCard
                            certification={certification}
                            key={certification.key}
                            progress={
                                props.certificationsProgresses.find(p => p.certificationId === certification.fccId)
                            }
                        />
                    ))}
            </div>
        </Fragment>
    )

    return (
        <div className={styles.wrap}>
            <div className={styles.coursesListHeaderWrap}>
                <div className={styles.coursesListHeader}>
                    <h2 className='details'>
                        Courses
                        <span className={classNames(styles.badge, 'medium-subtitle')}>
                            {certificationsCount}
                        </span>
                    </h2>

                </div>

                <div className={styles.teaseBanner}>
                    <h2>Check out our Courses</h2>
                    <p>
                        Topcoder is partnering with multiple content providers
                        to bring you a best in class course catalog. Stay tuned for more courses!
                    </p>
                </div>
            </div>

            {props.certificationsGroups.map(category => (
                (!props.selectedCategory || props.selectedCategory === category)
                && renderCertificationGroup(category)
            ))}
        </div>
    )
}

export default AvailableCoursesList
