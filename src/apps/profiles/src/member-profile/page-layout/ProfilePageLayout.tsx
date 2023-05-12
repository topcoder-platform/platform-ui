import { FC } from "react"
import { UserProfile, UserStats } from "~/libs/core"
import ProfilePageJumbo from "../jumbotron/ProfilePageJumbo"
import { MemberBasicInfo } from "../basic-info"
import { ContentLayout } from "~/libs/ui"

import styles from './ProfilePageLayout.module.scss'

interface ProfilePageLayoutProps {
    memberStats: UserStats | undefined
    profile: UserProfile | undefined
}

const ProfilePageLayout: FC<ProfilePageLayoutProps> = (props: ProfilePageLayoutProps) => {
    const { profile, memberStats } = props

    return (
        <div className={styles.container}>

            <ProfilePageJumbo profile={profile} />

            <ContentLayout>

                <div className={styles.basicInfoWrap}>
                    
                    <MemberBasicInfo profile={profile} memberStats={memberStats} />
                </div>

            </ContentLayout>

        </div>
    )
}

export default ProfilePageLayout