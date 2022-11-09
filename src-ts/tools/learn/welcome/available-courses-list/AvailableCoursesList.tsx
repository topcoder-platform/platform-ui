import { Dictionary, groupBy, identity, orderBy } from 'lodash'
import { Dispatch, FC, Fragment, SetStateAction, useMemo } from 'react'
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
    const certsByCategory: Dictionary<Array<LearnCertification>> = useMemo(() => groupBy(orderBy(props.certifications, 'title', 'asc'), 'category'), [props.certifications])

    // compute all the available category dropdown options
    const certsCategoriesOptions: Array<{
        label: string,
        value: string,
    }> = useMemo(() => [
        { label: 'All Categories', value: '', orderIndex: -1 },
        ...Object.keys(certsByCategory).sort().map(c => ({
            label: c,
            value: c,
        })),
    ], [certsByCategory])

    // create and sort the certificates groups
    const certificationsGroups: Array<string> = useMemo(() => orderBy(Object.keys(certsByCategory), [
        c => (PRIORITY_CATEGORIES.includes(c) ? -1 : 1),
        identity,
    ], ['asc', 'asc']), [certsByCategory])

    const certificationsCount: number = (certsByCategory[selectedCategory] ?? props.certifications).length

    return (
        <div className={styles.wrap}>
            <div className={styles['courses-list-header']}>
                <h3 className='details'>
                    Courses Available
                    <span className={classNames(styles.badge, 'medium-subtitle')}>
                        {certificationsCount}
                    </span>
                </h3>

                <div className={styles['courses-list-filters']}>
                    <InputSelect
                        options={certsCategoriesOptions}
                        value={selectedCategory}
                        onChange={e => setSelectedCategory(e.target.value as string)}
                        name='filter-courses'
                        label='Categories'
                    />
                </div>
            </div>

            {certificationsGroups.map(category => (!selectedCategory || selectedCategory === category) && (
                <Fragment key={category}>
                    <h4 className={classNames('details', styles['courses-group-title'])}>
                        {category}
                    </h4>

                    <div className={styles['courses-list']}>
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
            ))}
        </div>
    )
}

export default AvailableCoursesList
