import { Dictionary } from 'lodash'
import { ChangeEvent, FC, Fragment, ReactNode, useMemo } from 'react'
import classNames from 'classnames'

import { LearnCertification, LearnUserCertificationProgress } from '../../lib'
import { CoursesCard } from '../courses-card'
import { FilterBar } from '../filter-bar'

import styles from './AvailableCoursesList.module.scss'

interface AvailableCoursesListProps {
    certsByCategory: Dictionary<Array<LearnCertification>>
    certifications: ReadonlyArray<LearnCertification>
    certificationsGroups: Array<string>
    selectedCategory: string
    certificationsProgresses: ReadonlyArray<LearnUserCertificationProgress>
    onSelectCategory: (e: ChangeEvent<HTMLInputElement>) => void
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

    // compute all the available category dropdown options
    const certsCategoriesOptions: Array<{
        label: string,
        value: string,
    }> = useMemo(() => [
        { label: 'All Categories', orderIndex: -1, value: '' },
        ...Object.keys(props.certsByCategory)
            .sort()
            .map(c => ({
                label: c,
                value: c,
            })),
    ], [props.certsByCategory])

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

                    <FilterBar
                        certsCategoriesOptions={certsCategoriesOptions}
                        onSelectCategory={props.onSelectCategory}
                        selectedCategory={props.selectedCategory}
                    />
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
