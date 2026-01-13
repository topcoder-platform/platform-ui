import { Dispatch, FC, SetStateAction, useState } from 'react'

import { UserProfile, downloadProfileAsync } from '~/libs/core'
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

const ProfilePageLayout: FC<ProfilePageLayoutProps> = (props: ProfilePageLayoutProps) => {
    function canDownloadProfile(authProfile: UserProfile | undefined, profile: UserProfile): boolean {
        if (!authProfile) {
            return false
        }
        // Check if user is viewing their own profile
        if (authProfile.handle === profile.handle) {
            return true
        }
        // Check if user has admin roles
        const adminRoles = ['administrator', 'admin']
        if (authProfile.roles?.some(role => adminRoles.includes(role.toLowerCase()))) {
            return true
        }
        // Check if user has PM or Talent Manager roles
        const allowedRoles = ['Project Manager', 'Talent Manager']
        if (authProfile.roles?.some(role => allowedRoles.some(allowed => role.toLowerCase() === allowed.toLowerCase()))) {
            return true
        }
        return false
    }

    const canDownload: boolean = canDownloadProfile(props.authProfile, props.profile)

    const [isDownloading, setIsDownloading]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    async function handleDownloadProfile(): Promise<void> {
        if (isDownloading) {
            return
        }
        setIsDownloading(true)
        try {
            await downloadProfileAsync(props.profile.handle)
        } catch (error) {
            // Error handling - could show a toast notification here
            console.error('Failed to download profile:', error)
        } finally {
            setIsDownloading(false)
        }
    }

    return (
        <div className={styles.container}>

            <PageTitle>{`${props.profile.handle} | Community Profile | Topcoder`}</PageTitle>

            <div className={styles.profileHeaderWrap}>
                {
                    canDownload && (
                        <div className={styles.downloadButtonWrap}>
                            <Button
                                label='Download Profile'
                                icon={IconSolid.DownloadIcon}
                                iconToRight={true}
                                onClick={handleDownloadProfile}
                                disabled={isDownloading}
                                className={styles.downloadButton}
                            />
                        </div>
                    )
                }
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

                    {props.profile.userId === props.authProfile?.userId && (
                        <MemberLinks profile={props.profile} authProfile={props.authProfile} />
                    )}
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
                                    refreshProfile={props.refreshProfile}
                                />
                            </div>
                        </div>
                        <div className={styles.sectionWrap}>
                            <EducationAndCertifications
                                profile={props.profile}
                                authProfile={props.authProfile}
                                refreshProfile={props.refreshProfile}
                            />
                        </div>
                    </div>
                </div>
            </div>

        </ContentLayout>

        <OnboardingCompleted authProfile={props.authProfile} />

        </div>
    )
}

export default ProfilePageLayout
