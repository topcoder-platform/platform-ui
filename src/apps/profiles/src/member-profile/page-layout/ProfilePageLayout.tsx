import { FC } from 'react'

import { UserProfile } from '~/libs/core'
import { Button, ContentLayout, IconSolid, PageTitle } from '~/libs/ui'

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
import { ProfileCompleteness } from '../profile-completeness'
import OnboardingCompleted from '../onboarding-complete/OnboardingCompleted'

import styles from './ProfilePageLayout.module.scss'

interface ProfilePageLayoutProps {
    isTalentSearch?: boolean
    profile: UserProfile
    refreshProfile: (handle: string) => void
    authProfile: UserProfile | undefined
    handleBackBtn: () => void
}

const ProfilePageLayout: FC<ProfilePageLayoutProps> = (props: ProfilePageLayoutProps) => (
    <div className={styles.container}>

        <PageTitle>{`${props.profile.handle} | Community Profile | Topcoder`}</PageTitle>

        <div className={styles.profileHeaderWrap}>
            <ContentLayout
                outerClass={styles.profileHeaderContentOuter}
                contentClass={styles.profileHeaderContent}
            >
                {props.isTalentSearch && (
                    <div className={styles.backBtn}>
                        <Button
                            link
                            label='Search Results'
                            icon={IconSolid.ChevronLeftIcon}
                            iconToLeft
                            onClick={props.handleBackBtn}
                        />
                    </div>
                )}
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
            innerClass={styles.profileInner}
        >
            <div className={styles.profileInfoWrap}>
                <div className={styles.profileInfoLeft}>
                    <AboutMe
                        profile={props.profile}
                        authProfile={props.authProfile}
                        refreshProfile={props.refreshProfile}
                    />

                    <MemberLanguages profile={props.profile} authProfile={props.authProfile} />

                    <MemberLocalInfo
                        profile={props.profile}
                        authProfile={props.authProfile}
                        refreshProfile={props.refreshProfile}
                    />

                    <MemberLinks profile={props.profile} authProfile={props.authProfile} />
                </div>
                <div className={styles.profileInfoRight}>
                    {props.authProfile?.handle === props.profile.handle && (
                        <ProfileCompleteness profile={props.profile} authProfile={props.authProfile} />
                    )}
                    <div className={styles.sectionWrap}>
                        <div className={styles.skillsWrap}>
                            <MemberSkillsInfo
                                profile={props.profile}
                                authProfile={props.authProfile}
                                refreshProfile={props.refreshProfile}
                            />
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

        </ContentLayout>

        <OnboardingCompleted authProfile={props.authProfile} />

    </div>
)

export default ProfilePageLayout
