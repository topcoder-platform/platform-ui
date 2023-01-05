import { Dictionary, groupBy, identity, orderBy } from 'lodash'
import { ChangeEvent, Dispatch, FC, Fragment, ReactNode, SetStateAction, useCallback, useMemo } from 'react'
import classNames from 'classnames'

import { InputSelect, useLocalStorage } from '../../../../lib'
import { LearnCertification, UserCertificationCompleted, UserCertificationInProgress } from '../../learn-lib'
import { CoursesCard } from '../courses-card'

import styles from './AvailableCoursesList.module.scss'

interface AvailableCoursesListProps {
    certifications: ReadonlyArray<LearnCertification>
    userCompletedCertifications: ReadonlyArray<UserCertificationCompleted>
    userInProgressCertifications: ReadonlyArray<UserCertificationInProgress>
}

const PRIORITY_CATEGORIES: ReadonlyArray<string> = [
    'Data Science',
    'Web Development',
]

const AvailableCoursesList: FC<AvailableCoursesListProps> = (props: AvailableCoursesListProps) => {
    const [selectedCategory, setSelectedCategory]: [
        string,
        Dispatch<SetStateAction<string>>
    ] = useLocalStorage<string>('tca-welcome-filter-certs', '')

    // certificates indexed by category, sorted by title
    const certsByCategory: Dictionary<Array<LearnCertification>>
        = useMemo(() => groupBy(orderBy(props.certifications, 'title', 'asc'), 'category'), [props.certifications])

    // compute all the available category dropdown options
    const certsCategoriesOptions: Array<{
        label: string,
        value: string,
    }> = useMemo(() => [
        { label: 'All Categories', orderIndex: -1, value: '' },
        ...Object.keys(certsByCategory)
            .sort()
            .map(c => ({
                label: c,
                value: c,
            })),
    ], [certsByCategory])

    // create and sort the certificates groups
    const certificationsGroups: Array<string> = useMemo(() => orderBy(
        Object.keys(certsByCategory),
        [
            c => (PRIORITY_CATEGORIES.includes(c) ? -1 : 1),
            identity,
        ],
        ['asc', 'asc'],
    ), [certsByCategory])

    const onSelectCategory: (e: ChangeEvent<HTMLInputElement>) => void
        = useCallback((e: ChangeEvent<HTMLInputElement>) => {
            setSelectedCategory(e.target.value as string)
        }, [setSelectedCategory])

    const renderCertificationGroup: (category: string) => ReactNode = (category: string) => (
        <Fragment key={category}>
            <h4 className={classNames('details', styles['courses-group-title'])}>
                {category}
            </h4>

            <div className={styles.coursesList}>
                {certsByCategory[category]
                    .map(certification => (
                        <CoursesCard
                            certification={certification}
                            key={certification.key}
                            userCompletedCertifications={props.userCompletedCertifications}
                            userInProgressCertifications={props.userInProgressCertifications}
                        />
                    ))}
            </div>
        </Fragment>
    )

    return (
        <div className={styles.wrap}>
            <div className={styles.coursesListHeaderWrap}>
                <div className={styles.teaseBanner}>
                    <h2>Check out our Courses</h2>
                    <p>
                        Topcoder is partnering with multiple content providers
                        to bring you a best in class course catalog. Stay tuned for more courses!
                    </p>
                </div>
                <div className={styles.coursesListHeader}>
                    <h2 className='details'>Courses</h2>
                    <div className={styles.coursesListFilters}>
                        <InputSelect
                            options={certsCategoriesOptions}
                            value={selectedCategory}
                            onChange={onSelectCategory}
                            name='filter-courses'
                            label='Categories'
                        />
                    </div>
                </div>
            </div>

            {certificationsGroups.map(category => (
                (!selectedCategory || selectedCategory === category)
                && renderCertificationGroup(category)
            ))}
        </div>
    )
}

export default AvailableCoursesList
