import { FC } from "react"
import { UserProfile } from "~/libs/core"
import ProfilePageJumbo from "../jumbotron/ProfilePageJumbo"
import { MemberBasicInfo } from "../basic-info"
import { ContentLayout } from "~/libs/ui"
import { MemberTracksInfo } from "../tracks"
import { MemberSkillsInfo } from "../skills"

import styles from './ProfilePageLayout.module.scss'
import { CommunityAwards } from "../community-awards"
import { MemberTCAInfo } from "../tca-info"

interface ProfilePageLayoutProps {
    profile: UserProfile | undefined
}

const ProfilePageLayout: FC<ProfilePageLayoutProps> = (props: ProfilePageLayoutProps) => {
    const { profile } = props

    return (
        <div className={styles.container}>

            <ProfilePageJumbo profile={profile} />

            <ContentLayout
                outerClass={styles.contentLayoutOuter}
            >

                <div className={styles.basicInfoWrap}>
                    <div className={styles.skillsWrap}>
                        <MemberTracksInfo profile={profile} />

                        <MemberSkillsInfo profile={profile} />
                    </div>
                    <MemberBasicInfo profile={profile} />
                </div>

                <CommunityAwards profile={profile} />

                <MemberTCAInfo profile={profile} />

            </ContentLayout>

        </div>
    )
}

export default ProfilePageLayout