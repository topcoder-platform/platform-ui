import { FC, useContext, useMemo } from 'react'

import { Breadcrumb, BreadcrumbItemModel, ContentLayout, LoadingSpinner, Portal, profileContext, ProfileContextData } from '../../../lib'
import {
    AllCertificationsProviderData,
    LearnCertification,
    LearningHat,
    MyCourseCompletedCard,
    MyCourseInProgressCard,
    useAllCertifications,
    useLearnBreadcrumb,
    UserCertificationsProviderData,
    useUserCertifications,
    WaveHero
} from '../learn-lib'
import { LEARN_PATHS } from '../learn.routes'

import { HeroCard } from './hero-card'
import styles from './MyLearning.module.scss'

interface CertificatesByIdType {
    [key: string]: LearnCertification
}

const MyLearning: FC<{}> = () => {

    const { profile, initialized: profileReady }: ProfileContextData = useContext(profileContext)
    const { completed, inProgress, ready: coursesReady }: UserCertificationsProviderData = useUserCertifications()
    const { certifications, ready: certificatesReady }: AllCertificationsProviderData = useAllCertifications()

    const ready: boolean = profileReady && coursesReady && certificatesReady;

    const certificatesById: CertificatesByIdType = useMemo(() => (
        certifications.reduce((certifs, certificate) => {
            certifs[certificate.id] = certificate
            return certifs
        }, {} as unknown as CertificatesByIdType)
    ), [certifications])

    const breadcrumb: Array<BreadcrumbItemModel> = useLearnBreadcrumb([
        {
            name: 'My Learning',
            url: LEARN_PATHS.myLearning,
        },
    ])

    return (
        <ContentLayout contentClass={styles['content-layout']}>
            <Breadcrumb items={breadcrumb} />
            <div className={styles['wrap']}>
                <LoadingSpinner hide={ready} className={styles['loading-spinner']} />

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

                {ready && (
                    <>
                        <div className={styles['courses-area']}>
                            {inProgress.map((certif) => (
                                <MyCourseInProgressCard
                                    certification={certificatesById[certif.certificationId]}
                                    key={certif.certificationId}
                                    theme='detailed'
                                    currentLesson={certif.currentLesson}
                                    completedPercentage={certif.courseProgressPercentage / 100}
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
                    </>
                )}
            </div>
        </ContentLayout>
    )
}

export default MyLearning
