import { FC } from 'react'
import classNames from 'classnames'

import { PagePortalId } from '../../../config'
import { ContentLayout, LoadingSpinner, Portal } from '../../../lib'
import {
    AllCertificationsProviderData,
    useGetAllCertifications,
    useGetUserCertifications,
    UserCertificationsProviderData,
    WaveHero,
} from '../learn-lib'
import '../../../lib/styles/index.scss'

import { AvailableCoursesList } from './available-courses-list'
import { ProgressBlock } from './progress-block'
import { ReactComponent as TcAcademyFullLogoSvg } from './tca-full-logo.svg'
import styles from './WelcomePage.module.scss'

const WelcomePage: FC<{}> = () => {

    const allCertsData: AllCertificationsProviderData = useGetAllCertifications()
    const userCertsData: UserCertificationsProviderData = useGetUserCertifications()

    const coursesReady: boolean = allCertsData.ready && userCertsData.ready

    return (
        <ContentLayout>

            <div className={classNames(styles.wrap, 'full-height-frame')}>

                <Portal portalId={PagePortalId}>
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
                                allCertifications={allCertsData.certifications}
                                userCompletedCertifications={userCertsData.completed}
                                userInProgressCertifications={userCertsData.inProgress}
                                ready={coursesReady}
                            />
                        </WaveHero>
                    </div>
                </Portal>

                <div className={classNames(styles['courses-section'], 'full-height-frame')}>
                    <LoadingSpinner hide={coursesReady} />

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
