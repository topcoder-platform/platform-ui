import { Dispatch, FC, ReactNode, SetStateAction, useContext, useMemo, useState } from 'react'

import {
    Breadcrumb,
    BreadcrumbItemModel,
    ContentLayout,
    LoadingSpinner,
    Portal,
    profileContext,
    ProfileContextData,
} from '../../../lib'
import {
    AllCertificationsProviderData,
    LearnCertification,
    useGetAllCertifications,
    useGetUserCertifications,
    useLearnBreadcrumb,
    UserCertificationsProviderData,
    WaveHero,
} from '../learn-lib'
import { LEARN_PATHS } from '../learn.routes'

import { CompletedTab } from './completed-tab'
import { HeroCard } from './hero-card'
import { InProgressTab } from './in-progress-tab'
import { MyTabsNavbar, MyTabsViews } from './my-tabs-navbar'
import styles from './MyLearning.module.scss'

interface CertificatesByIdType {
    [key: string]: LearnCertification
}

const MyLearning: FC<{}> = () => {

    const { profile, initialized: profileReady }: ProfileContextData = useContext(profileContext)
    const { completed, inProgress, ready: coursesReady }: UserCertificationsProviderData = useGetUserCertifications()
    const { certifications, ready: certificatesReady }: AllCertificationsProviderData = useGetAllCertifications()
    const [activeTab, setActiveTab]: [MyTabsViews | undefined, Dispatch<SetStateAction<MyTabsViews | undefined>>]
        = useState()

    const ready: boolean = profileReady && coursesReady && certificatesReady

    const certificatesById: CertificatesByIdType = useMemo(() => (
        certifications.reduce((certifs, certificate) => {
            // eslint-disable-next-line no-param-reassign
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

    const renderTabs: () => ReactNode = () => (
        <MyTabsNavbar
            inProgress={inProgress.length}
            completed={completed.length}
            onTabChange={setActiveTab}
        >
            {activeTab === MyTabsViews.completed ? (
                <CompletedTab
                    allCertificates={certifications}
                    certificatesById={certificatesById}
                    certifications={completed}
                />
            ) : (
                <InProgressTab
                    allCertificates={certifications}
                    certificatesById={certificatesById}
                    certifications={inProgress}
                />
            )}
        </MyTabsNavbar>
    )

    return (
        <ContentLayout contentClass={styles['content-layout']}>
            <Breadcrumb items={breadcrumb} />
            <div className={styles.wrap}>
                <LoadingSpinner hide={ready} className={styles['loading-spinner']} />

                <Portal portalId='page-subheader-portal-el'>
                    <div className={styles['hero-wrap']}>
                        <WaveHero
                            title='my learning'
                            theme='light'
                            text={`
                                This is your very own page to keep track of your professional education and skill 
                                building. From here you can resume your courses in progress or review past 
                                accomplishments.
                            `}
                        >
                            <HeroCard userHandle={profile?.handle} />
                        </WaveHero>
                    </div>
                </Portal>

                {ready && renderTabs()}
            </div>
        </ContentLayout>
    )
}

export default MyLearning
