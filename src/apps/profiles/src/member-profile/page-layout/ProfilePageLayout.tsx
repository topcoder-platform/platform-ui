import { FC } from 'react'

import { UserProfile } from '~/libs/core'
import { ContentLayout, PageTitle } from '~/libs/ui'
import { useCheckIsMobile } from '~/libs/shared'

// import { MemberTCActivityInfo } from '../tc-activity'
import { MemberSkillsInfo } from '../skills'
import { ProfileHeader } from '../profile-header'
import { MemberLocalInfo } from '../local-info'
import { MemberLanguages } from '../languages'
import { AboutMe } from '../about-me'
import { MemberLinks } from '../links'
import { MemberTCAchievements } from '../tc-achievements'
import { WorkExpirence } from '../work-expirence'
import { EducationAndCertifications } from '../education-and-certifications'
import OnboardingCompleted from '../onboarding-complete/OnboardingCompleted'

import styles from './ProfilePageLayout.module.scss'

interface ProfilePageLayoutProps {
    profile: UserProfile
    refreshProfile: (handle: string) => void
    authProfile: UserProfile | undefined
}

const ProfilePageLayout: FC<ProfilePageLayoutProps> = (props: ProfilePageLayoutProps) => {
    const isMobile: boolean = useCheckIsMobile()

    return (
        <div className={styles.container}>

            <PageTitle>{`${props.profile.handle} | Community Profile | Topcoder`}</PageTitle>

            <div className={styles.profileHeaderWrap}>
                <ContentLayout
                    outerClass={styles.profileHeaderContentOuter}
                    contentClass={styles.profileHeaderContent}
                >
                    <ProfileHeader
                        profile={props.profile}
                        authProfile={props.authProfile}
                        refreshProfile={props.refreshProfile}
                    />
                </ContentLayout>
                <div className={styles.profileHeaderBottom} />
            </div>

            <ContentLayout
                outerClass={styles.profileOuter}
            >
                <div className={styles.profileInfoWrap}>
                    <div className={styles.profileInfoLeft}>
                        {
                            !isMobile && (
                                <AboutMe
                                    profile={props.profile}
                                    authProfile={props.authProfile}
                                    refreshProfile={props.refreshProfile}
                                />
                            )
                        }

                        <MemberLanguages profile={props.profile} authProfile={props.authProfile} />

                        <MemberLinks profile={props.profile} authProfile={props.authProfile} />

                        <MemberLocalInfo profile={props.profile} />
                    </div>
                    <div className={styles.profileInfoRight}>
                        {
                            isMobile && (
                                <AboutMe
                                    profile={props.profile}
                                    authProfile={props.authProfile}
                                    refreshProfile={props.refreshProfile}
                                />
                            )
                        }

                        <div className={styles.sectionWrap}>
                            <div className={styles.skillsWrap}>
                                <MemberSkillsInfo profile={props.profile} authProfile={props.authProfile} />
                            </div>
                        </div>

                        <MemberTCAchievements profile={props.profile} />

                        <div className={styles.expirenceWrap}>
                            <div>
                                <div className={styles.sectionWrap}>
                                    <WorkExpirence
                                        profile={props.profile}
                                        authProfile={props.authProfile}
                                    />
                                </div>
                            </div>
                            <div className={styles.sectionWrap}>
                                <EducationAndCertifications
                                    profile={props.profile}
                                    authProfile={props.authProfile}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* <MemberTCActivityInfo profile={props.profile} /> */}

            </ContentLayout>

            <OnboardingCompleted authProfile={props.authProfile} />

        </div>
    )
}

export default ProfilePageLayout
