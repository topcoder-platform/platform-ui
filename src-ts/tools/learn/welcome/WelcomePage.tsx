import classNames from 'classnames'
import { Dispatch, FC, SetStateAction } from 'react'

import { ContentLayout, InputSelect, LoadingSpinner, Portal, useLocalStorage } from '../../../lib'
import '../../../lib/styles/index.scss'
import {
    AllCertificationsProviderData,
    ALL_CERTIFICATIONS_DEFAULT_SORT,
    ALL_CERTIFICATIONS_SORT_FIELD_TYPE,
    ALL_CERTIFICATIONS_SORT_OPTIONS,
    useAllCertifications,
    UserCertificationsProviderData,
    useUserCertifications,
    WaveHero,
} from '../learn-lib'

import { CoursesCard } from './courses-card'
import { ProgressBlock } from './progress-block'
import styles from './WelcomePage.module.scss'

const WelcomePage: FC<{}> = () => {

    const [sortField, setSortField]: [
        ALL_CERTIFICATIONS_SORT_FIELD_TYPE,
        Dispatch<SetStateAction<ALL_CERTIFICATIONS_SORT_FIELD_TYPE>>
    ] = useLocalStorage<ALL_CERTIFICATIONS_SORT_FIELD_TYPE>('tca-welcome-sort-certs', ALL_CERTIFICATIONS_DEFAULT_SORT)

    const allCertsData: AllCertificationsProviderData = useAllCertifications(
        undefined,
        undefined,
        {
            sort: {
                direction: sortField === 'createdAt' ? 'desc' : 'asc',
                field: sortField,
            },
        }
    )
    const userCertsData: UserCertificationsProviderData = useUserCertifications()

    const coursesReady: boolean = allCertsData.ready && userCertsData.ready

    return (
        <ContentLayout>

            <div className={classNames(styles.wrap, 'full-height-frame')}>

                <Portal portalId='page-subheader-portal-el'>
                    <div className={styles['hero-wrap']}>
                        <WaveHero
                            title='Welcome to Topcoder ACADEMY'
                            text={`
                                The Topcoder Academy will provide you with learning opportunities
                                in the form of guided learning paths.
                                You will have the opportunity to learn new skills that will better
                                prepare you to earn on the Topcoder platform.<br />
                                <br />
                                We look forward to learning with you!
                            `}
                            theme='light'
                        >
                            <ProgressBlock
                                allCertifications={allCertsData.allCertifications}
                                userCompletedCertifications={userCertsData.completed}
                                userInProgressCertifications={userCertsData.inProgress}
                                ready={coursesReady}
                            />
                        </WaveHero>
                    </div>
                </Portal>

                <div className={classNames(styles['courses-section'], 'full-height-frame')}>

                    <div className={styles['courses-list-header']}>
                        <h3 className='details'>
                            Courses Available
                            <span className={classNames(styles['badge'], 'medium-subtitle')}>
                                {allCertsData.certifications.length}
                            </span>
                        </h3>

                        <div className={styles['courses-list-filters']}>
                            <InputSelect
                                options={ALL_CERTIFICATIONS_SORT_OPTIONS}
                                value={sortField}
                                onChange={(e) => setSortField(e.target.value as ALL_CERTIFICATIONS_SORT_FIELD_TYPE)}
                                name='sort-courses'
                                label='Sort by'
                            ></InputSelect>
                        </div>
                    </div>

                    <LoadingSpinner hide={coursesReady} />

                    {coursesReady && (
                        <div className={styles['courses-list']}>
                            {allCertsData.certifications
                                .map((certification, i) => (
                                    <CoursesCard
                                        certification={certification}
                                        key={`${certification.key}::${sortField}`}
                                        userCompletedCertifications={userCertsData.completed}
                                        userInProgressCertifications={userCertsData.inProgress}
                                    />
                                ))}
                        </div>
                    )}
                </div>
            </div>
        </ContentLayout>
    )
}

export default WelcomePage
