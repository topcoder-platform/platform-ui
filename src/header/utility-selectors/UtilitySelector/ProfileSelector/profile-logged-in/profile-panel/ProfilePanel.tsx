import { FC, useContext } from 'react'

import {
    AuthenticationUrlConfig,
    ProfileContext,
    ProfileContextData,
    ProfileRouteConfig,
} from '../../../../../../lib'

import styles from './ProfilePanel.module.scss'

const ProfilePanel: FC<{}> = () => {

    const { profile }: ProfileContextData = useContext(ProfileContext)

    if (!profile) {
        // this should never happen
        return <></>
    }

    return (
        <div className={styles['profile-panel']}>
            <div className={styles.handle}>
                {profile.handle}
            </div>
            <a href={ProfileRouteConfig.profile} className={styles.profile}>
                My Profile
            </a>
            <a href={AuthenticationUrlConfig.logout} className={styles.logout}>
                Log Out
            </a>
        </div>
    )
}

export default ProfilePanel
