import { FC } from 'react'

import { ContentLayout, LoadingSpinner, Portal } from '../../../lib'
import { CertificationsProviderData, useCertificationsProvider, WaveHero } from '../learn-lib'
import { getCoursePath } from '../learn.routes'

import { CoursesCard } from './courses-card'
import { ProgressBlock } from './progress-block'
import styles from './WelcomePage.module.scss'

interface WelcomePageProps {
}

const WelcomePage: FC<WelcomePageProps> = (props: WelcomePageProps) => {
    const {
        certifications,
        ready,
    }: CertificationsProviderData = useCertificationsProvider()

    return (
        <ContentLayout>
            <div className={styles.wrap}>
                <Portal portalId='page-subheader-portal-el'>
                    <WaveHero
                        title='Welcome to Topcoder ACADEMY'
                        text={`
                            Thank you for visiting the Topcoder Academy.
                            The Topcoder Academy will provide enhanced learning
                            opportunities to you, our Topcoder community.
                            These learning opportunities will take form as guided learning paths
                            where you will have the opportunity to learn new skills.
                            With these newly learned skills, you will be better prepared to be
                            successful in competing in challenges and Topcoder matches,
                            you will have greater opportunities for gig work placement and will
                            improve your overall opportunity to earn on the Topcoder platform.
                            Welcome to the Topcoder Academy, we look forward to learning with you!
                        `}
                        theme='light'
                    >
                        <ProgressBlock certificates={certifications} />
                    </WaveHero>
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
