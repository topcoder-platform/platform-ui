import { FC, useContext } from 'react'
import classNames from 'classnames'

import { PageSubheaderPortalId } from '../../../config'
import {
    ContentLayout,
    LoadingSpinner,
    PageDivider,
    Portal,
    profileContext,
    ProfileContextData,
} from '../../../lib'
import {
    AllCertificationsProviderData,
    TCACertificationsProgressProviderData,
    TCACertificationsProviderData,
    useGetAllCertifications,
    useGetAllTCACertifications,
    useGetAllTCACertificationsProgress,
    useGetUserCertifications,
    UserCertificationsProviderData,
    WaveHero,
} from '../learn-lib'
import '../../../lib/styles/index.scss'

import { AvailableCoursesList } from './available-courses-list'
import { WhatTCACanDo } from './what-tca-cando'
import { TCCertifications } from './tc-certifications'
import styles from './WelcomePage.module.scss'

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

    return (
        <ContentLayout>

            <div className={classNames(styles.wrap, 'full-height-frame')}>

                <Portal portalId={PageSubheaderPortalId}>
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
                </Portal>

                <div className={classNames(styles['courses-section'], 'full-height-frame')}>
                    <LoadingSpinner hide={ready} />

                    <WhatTCACanDo />

                    <PageDivider />

                    <TCCertifications
                        certifications={allTCACertifications.certifications}
                        progress={certsProgress}
                    />

                    <PageDivider />

                    {coursesReady && (
                        <AvailableCoursesList
                            certifications={allCertsData.certifications}
                            userCompletedCertifications={userCertsData.completed}
                            userInProgressCertifications={userCertsData.inProgress}
                        />
                    )}
                </div>
            </div>
        </ContentLayout>
    )
}

export default WelcomePage
