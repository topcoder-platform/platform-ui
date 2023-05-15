import { FC } from "react"
import { UserProfile, UserStats } from "~/libs/core"
import ProfilePageJumbo from "../jumbotron/ProfilePageJumbo"
import { MemberBasicInfo } from "../basic-info"
import { ContentLayout } from "~/libs/ui"

import styles from './ProfilePageLayout.module.scss'
import { MemberTracksInfo } from "../tracks"

interface ProfilePageLayoutProps {
    memberCountry: string | undefined
    memberStats: UserStats | undefined
    profile: UserProfile | undefined
}

const ProfilePageLayout: FC<ProfilePageLayoutProps> = (props: ProfilePageLayoutProps) => {
    const { profile, memberCountry, memberStats } = props

    return (
        <div className={styles.container}>

            <ProfilePageJumbo profile={profile} />

            <ContentLayout
                outerClass={styles.contentLayoutOuter}
            >

                <div className={styles.basicInfoWrap}>
                    <div className={styles.skillsWrap}>
                        <MemberTracksInfo profile={profile} />
                    </div>
                    <MemberBasicInfo profile={profile} memberCountry={memberCountry} memberStats={memberStats} />
                </div>

            </ContentLayout>

        </div>
    )
}

export default ProfilePageLayout