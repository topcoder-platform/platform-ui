import { FC } from 'react'

import { UserProfile } from '~/libs/core'
import { ContentLayout, PageTitle } from '~/libs/ui'
import { useCheckIsMobile } from '~/libs/shared'

// import { MemberTCActivityInfo } from '../tc-activity'
import { MemberTracksInfo } from '../tracks'
import { MemberSkillsInfo } from '../skills'
import { CommunityAwards } from '../community-awards'
import { MemberTCAInfo } from '../tca-info'
import { ProfileHeader } from '../profile-header'
import { MemberLocalInfo } from '../local-info'
import { MemberLangagues } from '../langagues'
import { AboutMe } from '../about-me'

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

            <ContentLayout
                outerClass={styles.contentLayoutOuter}
            >
                <PageTitle>{`${props.profile.handle} | Community Profile | Topcoder`}</PageTitle>

                <div className={styles.profileInfoWrap}>
                    <div className={styles.profileInfoLeft}>
                        <ProfileHeader profile={props.profile} authProfile={props.authProfile} />

                        {
                            isMobile && (
                                <AboutMe
                                    profile={props.profile}
                                    authProfile={props.authProfile}
                                    refreshProfile={props.refreshProfile}
                                />
                            )
                        }

                        <div className={styles.skillsWrap}>
                            <MemberSkillsInfo profile={props.profile} />
                        </div>

                        <MemberTracksInfo profile={props.profile} />

                        <CommunityAwards profile={props.profile} />

                        <MemberTCAInfo profile={props.profile} />
                    </div>
                    <div className={styles.profileInfoRight}>
                        {
                            !isMobile && (
                                <AboutMe
                                    profile={props.profile}
                                    authProfile={props.authProfile}
                                    refreshProfile={props.refreshProfile}
                                />
                            )
                        }

                        <MemberLangagues profile={props.profile} authProfile={props.authProfile} />

                        <MemberLocalInfo profile={props.profile} />
                    </div>
                </div>

                {/* <MemberTCActivityInfo profile={props.profile} /> */}

            </ContentLayout>

        </div>
    )
}

export default ProfilePageLayout
