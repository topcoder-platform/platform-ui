import classNames from 'classnames'
import { uniq } from 'lodash'
import { Dispatch, FC, SetStateAction, useMemo } from 'react'

import { ContentLayout, InputSelect, LoadingSpinner, Portal, useLocalStorage } from '../../../lib'
import '../../../lib/styles/index.scss'
import {
    AllCertificationsProviderData,
    LearnCertification,
    useAllCertifications,
    UserCertificationsProviderData,
    useUserCertifications,
    WaveHero,
} from '../learn-lib'

import { CoursesCard } from './courses-card'
import { ProgressBlock } from './progress-block'
import { ReactComponent as TcAcademyFullLogoSvg } from './tca-full-logo.svg'
import styles from './WelcomePage.module.scss'

type SORT_FIELD_TYPE = keyof LearnCertification
const SORT_OPTIONS: Array<{label: string, value: SORT_FIELD_TYPE}> = [
    {label: 'Category', value: 'category'},
    {label: 'Newest', value: 'createdAt'},
    {label: 'Title', value: 'title'},
]
export const DEFAULT_SORT: SORT_FIELD_TYPE = SORT_OPTIONS[0].value

const WelcomePage: FC<{}> = () => {

    const [sortField, setSortField]: [
        SORT_FIELD_TYPE,
        Dispatch<SetStateAction<SORT_FIELD_TYPE>>
    ] = useLocalStorage<SORT_FIELD_TYPE>('tca-welcome-sort-certs', DEFAULT_SORT)

    const [selectedCategory, setSelectedCategory]: [
        string,
        Dispatch<SetStateAction<string>>
    ] = useLocalStorage<string>('tca-welcome-filter-certs', '')

    const allCertsData: AllCertificationsProviderData = useAllCertifications(
        undefined,
        undefined,
        {
            filter: {
                field: 'category',
                value: selectedCategory,
            },
            sort: {
                direction: sortField === 'createdAt' ? 'desc' : 'asc',
                field: sortField,
            },
        }
    )
    const userCertsData: UserCertificationsProviderData = useUserCertifications()

    const coursesReady: boolean = allCertsData.ready && userCertsData.ready

    const certsCategoriesOptions: Array<{label: string, value: string}> = useMemo(() => {
        const certsCategories: Array<string> = uniq(allCertsData.allCertifications.map(c => c.category))
        return [
            {label: 'All Categories', value: ''},
            ...certsCategories.map((c) => ({value: c, label: c})),
        ]
    }, [allCertsData])

    return (
        <ContentLayout>

            <div className={classNames(styles.wrap, 'full-height-frame')}>

                <Portal portalId='page-subheader-portal-el'>
                    <div className={styles['hero-wrap']}>
                        <WaveHero
                            title={(
                                <>
                                    <TcAcademyFullLogoSvg className='tca-logo' />
                                    Welcome!
                                </>
                            )}
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
                                options={certsCategoriesOptions}
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value as string)}
                                name='filter-courses'
                                label='Categories'
                            ></InputSelect>
                            <InputSelect
                                options={SORT_OPTIONS}
                                value={sortField}
                                onChange={(e) => setSortField(e.target.value as SORT_FIELD_TYPE)}
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
