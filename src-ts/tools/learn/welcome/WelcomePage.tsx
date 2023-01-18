import { FC } from 'react'
import classNames from 'classnames'

import { PageSubheaderPortalId } from '../../../config'
import { ContentLayout, LoadingSpinner, PageDivider, Portal } from '../../../lib'
import {
    AllCertificationsProviderData,
    TCACertificationsProviderData,
    useGetAllCertifications,
    useGetAllTCACertificationsMOCK,
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

    const allCertsData: AllCertificationsProviderData = useGetAllCertifications()
    const userCertsData: UserCertificationsProviderData = useGetUserCertifications()

    const coursesReady: boolean = allCertsData.ready && userCertsData.ready

    // TODO: this hook is mocked - remove mock when API is available...
    const allTCACertifications: TCACertificationsProviderData = useGetAllTCACertificationsMOCK()

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
                    <LoadingSpinner hide={coursesReady} />

                    <WhatTCACanDo />

                    <PageDivider />

                    <TCCertifications certifications={allTCACertifications.certifications} />

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
