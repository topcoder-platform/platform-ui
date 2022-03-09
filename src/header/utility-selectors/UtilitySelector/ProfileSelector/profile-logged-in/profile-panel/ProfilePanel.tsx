import { FC, useContext } from 'react'

import { AuthenticationUrlConfig, ProfileContext, ProfileContextData, ProfileRoutesConfig } from '../../../../../../lib'

import styles from './ProfilePanel.module.scss'

const ProfilePanel: FC<{}> = () => {

    const { profile }: ProfileContextData = useContext(ProfileContext)

    if (!profile) {
        // this should never happen
        return <></>
    }

    const authEndpoints: AuthenticationUrlConfig = new AuthenticationUrlConfig()
    const profileRoutes: ProfileRoutesConfig = new ProfileRoutesConfig()

    return (
        <div className={styles['profile-panel']}>
            <div className={styles.handle}>
                {profile.handle}
            </div>
            <a href={profileRoutes.profile} className={styles.profile}>
                My Profile
            </a>
            <a href={authEndpoints.logout} className={styles.logout}>
                Log Out
            </a>
        </div>
    )
}

export default ProfilePanel
