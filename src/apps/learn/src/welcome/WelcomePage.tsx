import { ChangeEvent, Dispatch, FC, SetStateAction, useCallback, useContext, useMemo } from 'react'
import { Dictionary, groupBy, identity, orderBy } from 'lodash'
import classNames from 'classnames'

import {
    ContentLayout,
    LoadingSpinner,
    PageDivider,
} from '~/libs/ui'
import { profileContext, ProfileContextData } from '~/libs/core'
import { useLocalStorage } from '~/libs/shared'

import {
    AllCertificationsProviderData,
    LearnCertification,
    PageTitle,
    TCACertificationsProgressProviderData,
    TCACertificationsProviderData,
    useGetAllCertifications,
    useGetAllTCACertifications,
    useGetAllTCACertificationsProgress,
    useGetUserCertifications,
    UserCertificationsProviderData,
    WaveHero,
} from '../lib'

import { AvailableCoursesList } from './available-courses-list'
import { TCCertifications } from './tc-certifications'
import { WhatTCACanDo } from './what-tca-cando'
import styles from './WelcomePage.module.scss'

const PRIORITY_CATEGORIES: ReadonlyArray<string> = [
    'Data Science',
    'Web Development',
]

const WelcomePage: FC = () => {
    const { initialized: profileReady, profile }: ProfileContextData = useContext(profileContext)

    const allCertsData: AllCertificationsProviderData = useGetAllCertifications()
    const userCertsData: UserCertificationsProviderData = useGetUserCertifications()

    const coursesReady: boolean = allCertsData.ready && userCertsData.ready

    const allTCACertifications: TCACertificationsProviderData = useGetAllTCACertifications()

    const {
        progresses: certsProgress,
        ready: progressReady,
    }: TCACertificationsProgressProviderData = useGetAllTCACertificationsProgress(
        profile?.userId as unknown as string,
        { enabled: profileReady && !!profile },
    )

    const ready: boolean = profileReady && coursesReady && (!profile || progressReady)

    const [selectedCategory, setSelectedCategory]: [
        string,
        Dispatch<SetStateAction<string>>
    ] = useLocalStorage<string>('tca-welcome-filter-certs', '')

    // certificates indexed by category, sorted by title
    const certsByCategory: Dictionary<Array<LearnCertification>>
        = useMemo(() => (
            groupBy(orderBy(allCertsData.certifications, 'title', 'asc'), 'certificationCategory.category')
        ), [allCertsData.certifications])

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

    return (
        <>
            <div className={styles['hero-wrap']}>
                <WaveHero
                    title={(
                        <>Topcoder Academy</>
                    )}
                    text={`
                        The Topcoder Academy will provide you with learning opportunities
                        in the form of guided learning paths.
                        You will have the opportunity to learn new skills that will better
                        prepare you to earn on the Topcoder platform.
                    `}
                    theme='light'
                />
            </div>
            <ContentLayout>
                <PageTitle>Learn</PageTitle>

                <div className={classNames(styles.wrap, 'full-height-frame')}>

                    <div className={classNames(styles['courses-section'], 'full-height-frame')}>
                        <LoadingSpinner hide={ready} />

                        <WhatTCACanDo />

                        <TCCertifications
                            certifications={allTCACertifications.certifications}
                            progress={certsProgress}
                        />

                        <PageDivider />

                        {coursesReady && (
                            <AvailableCoursesList
                                certsByCategory={certsByCategory}
                                certifications={allCertsData.certifications}
                                certificationsGroups={certificationsGroups}
                                selectedCategory={selectedCategory}
                                certificationsProgresses={userCertsData.progresses}
                                onSelectCategory={onSelectCategory}
                            />
                        )}
                    </div>
                </div>
            </ContentLayout>
        </>
    )
}

export default WelcomePage
