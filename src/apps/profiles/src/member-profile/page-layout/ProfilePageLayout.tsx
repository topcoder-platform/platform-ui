import { FC } from "react"
import { UserProfile } from "~/libs/core"
import ProfilePageJumbo from "../jumbotron/ProfilePageJumbo"

import styles from './ProfilePageLayout.module.scss'

interface ProfilePageLayoutProps {
    profile: UserProfile | undefined
}

const ProfilePageLayout: FC<ProfilePageLayoutProps> = (props: ProfilePageLayoutProps) => {
    const { profile } = props

    return (
        <div className={styles.container}>
            
            <ProfilePageJumbo profile={profile} />

        </div>
    )
}

export default ProfilePageLayout