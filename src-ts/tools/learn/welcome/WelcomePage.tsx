import { FC } from 'react'

import { ContentLayout, LoadingSpinner, Portal } from '../../../lib'
import { CertificationsProviderData, useCertificationsProvider, WaveHero } from '../learn-lib'
import { getCoursePath } from '../learn.routes'

import { CoursesCard } from './courses-card'
import { ProgressBlock } from './progress-block'
import styles from './WelcomePage.module.scss'

const WelcomePage: FC<{}> = () => {
    const {
        certifications,
        ready,
    }: CertificationsProviderData = useCertificationsProvider()

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
                            <ProgressBlock certificates={certifications} />
                        </WaveHero>
                    </div>
                </Portal>

                <div className={styles['courses-section']}>
                    <h3 className='details'>Courses Available</h3>
                    {!ready && (
                        <LoadingSpinner />
                    )}

                    {ready && (
                        <div className={styles['courses-list']}>
                            {certifications.map((certification) => (
                                <CoursesCard
                                    title={certification.title}
                                    type={certification.category}
                                    link={certification.state === 'active' ? getCoursePath(certification.providerName, certification.certification) : undefined}
                                    credits={certification.providerName}
                                    key={certification.key}
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
