import { FC } from 'react'

import { ContentLayout, LoadingSpinner, Portal } from '../../../lib'
import {
    AllCertificationsProviderData,
    useAllCertifications,
    UserCertificationsProviderData,
    useUserCertifications,
    WaveHero,
} from '../learn-lib'

import { CoursesCard } from './courses-card'
import { ProgressBlock } from './progress-block'
import styles from './WelcomePage.module.scss'

const WelcomePage: FC<{}> = () => {

    const allCertsData: AllCertificationsProviderData = useAllCertifications()
    const userCertsData: UserCertificationsProviderData = useUserCertifications()

    const coursesReady: boolean = allCertsData.ready && userCertsData.ready

    return (
        <ContentLayout>
            <div className={styles.wrap}>
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
                                allCertifications={allCertsData.certifications}
                                userCompletedCertifications={userCertsData.completed}
                                userInProgressCertifications={userCertsData.inProgress}
                                ready={coursesReady}
                            />
                        </WaveHero>
                    </div>
                </Portal>

                <div className={styles['courses-section']}>
                    <h3 className='details'>Courses Available</h3>

                    <LoadingSpinner show={!coursesReady} />

                    {coursesReady && (
                        <div className={styles['courses-list']}>
                            {allCertsData.certifications
                                .map((certification) => (
                                    <CoursesCard
                                        certification={certification}
                                        key={certification.key}
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
