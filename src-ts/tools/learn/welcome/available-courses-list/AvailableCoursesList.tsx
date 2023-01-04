import { Dictionary, groupBy, identity, orderBy } from 'lodash'
import { Dispatch, FC, Fragment, ReactNode, SetStateAction, useMemo } from 'react'
import classNames from 'classnames'

import { useLocalStorage } from '../../../../lib'
import { LearnCertification, UserCertificationCompleted, UserCertificationInProgress } from '../../learn-lib'
import { CoursesCard } from '../courses-card'

import styles from './AvailableCoursesList.module.scss'
import { Certificate } from '../../course-certificate/certificate-view/certificate'

interface AvailableCoursesListProps {
    certifications: ReadonlyArray<LearnCertification>
    userCompletedCertifications: ReadonlyArray<UserCertificationCompleted>
    userInProgressCertifications: ReadonlyArray<UserCertificationInProgress>
}

const AvailableCoursesList: FC<AvailableCoursesListProps> = (props: AvailableCoursesListProps) => {

    console.log('AvailableCoursesList', props);

    return (
        <div className={styles.wrap}>
            <div className={styles['courses-list-header']}>
                <h2 className='details'>Courses</h2>
                <div className={styles.teaseBanner}>
                    <h2>Check out our Courses</h2>
                    <p>Topcoder is partnering with multiple content providers to bring you a best in class course catalog. Stay tuned for more courses!</p>
                </div>
            </div>

            <div className={styles['courses-list']}>
                {
                    props.certifications.map(certificate =>
                        <CoursesCard
                            key={certificate.id}
                            certification={certificate}
                            userCompletedCertifications={props.userCompletedCertifications}
                            userInProgressCertifications={props.userInProgressCertifications}
                        />
                    )
                }
            </div>
        </div>
    )
}

export default AvailableCoursesList
