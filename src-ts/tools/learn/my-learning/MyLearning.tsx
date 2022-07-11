import { FC, useContext, useMemo } from 'react'

import { Breadcrumb, BreadcrumbItemModel, ContentLayout, Portal, profileContext, ProfileContextData } from '../../../lib'
import {
    CertificationsProviderData,
    LearnCertification,
    LearningHat,
    MyCertificationsProviderData,
    MyCourseCompletedCard,
    MyCourseInProgressCard,
    useCertificationsProvider,
    useMyCertifications,
    WaveHero
} from '../learn-lib'
import { LEARN_PATHS } from '../learn.routes'

import { HeroCard } from './hero-card'
import styles from './MyLearning.module.scss'

interface CertificatesByIdType {
    [key: string]: LearnCertification
}

const MyLearning: FC<{}> = () => {

    const { profile }: ProfileContextData = useContext(profileContext)
    const { completed, inProgress }: MyCertificationsProviderData = useMyCertifications(profile?.userId)

    const {
        certifications,
    }: CertificationsProviderData = useCertificationsProvider()

    const certificatesById: CertificatesByIdType = useMemo(() => (
        certifications.reduce((certifs, certificate) => {
            certifs[certificate.id] = certificate
            return certifs
}, {} as unknown as CertificatesByIdType)
    ), [certifications])

    const breadcrumb: Array<BreadcrumbItemModel> = useMemo(() => [
        { url: '/learn', name: 'Topcoder Academy' },
        { url: LEARN_PATHS.myLearning, name: 'My Learning' },
    ], [])

    return (
        <ContentLayout contentClass={styles['content-layout']}>
            <Breadcrumb items={breadcrumb} />
            <div className={styles['wrap']}>
                <Portal portalId='page-subheader-portal-el'>
                    <div className={styles['hero-wrap']}>
                        <WaveHero
                            title='my learning'
                            text={`
                                This is your very own page to keep track of your professional education and skill building.
                                From here you can resume your courses in progress or review past accomplishments.
                            `}
                        >
                            <HeroCard userHandle={profile?.handle} />
                        </WaveHero>
                    </div>
                </Portal>

                <div className={styles['courses-area']}>
                    {inProgress.map((certif) => (
                        <MyCourseInProgressCard
                            certification={certificatesById[certif.certificationId]}
                            key={certif.certificationId}
                            theme='detailed'
                            currentLesson={certif.currentLesson}
                            completedPercentage={certif.courseProgressPercentage/100}
                            startDate={certif.startDate}
                        />
                    ))}
                </div>

                {!!completed.length && (
                    <div className={styles['courses-area']}>
                        <div className={styles['title-line']}>
                            <LearningHat />
                            <h2 className='details'>Completed Courses</h2>
                        </div>

                        <div className={styles['cards-wrap']}>
                            {completed.map((certif) => (
                                <MyCourseCompletedCard
                                    certification={certificatesById[certif.certificationId]}
                                    key={certif.certificationId}
                                    completed={certif.completedDate}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </ContentLayout>
    )
}

export default MyLearning
