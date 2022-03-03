import { FC } from 'react'

import { AuthenticationUrlConfig, ProfileRoutesConfig } from '../../../../../../lib'

import styles from './ProfilePanel.module.scss'

const ProfilePanel: FC<{}> = () => {

    // TODO: logout
    // const authEndpoints: AuthenticationUrlConfig = new AuthenticationUrlConfig()
    const profileRoutes: ProfileRoutesConfig = new ProfileRoutesConfig()

    return (
        <div className={styles['profile-panel']}>
            <a href={profileRoutes.profile}>
                My Profile
            </a>
            {/* TODO: logout */}
            <a href={profileRoutes.profile}>
                Log Out
            </a>
        </div>
    )
}

export default ProfilePanel
