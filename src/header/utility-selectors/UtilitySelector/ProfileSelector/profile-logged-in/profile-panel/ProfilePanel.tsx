import { FC, useContext } from 'react'
import { Link } from 'react-router-dom'

import {
<<<<<<< HEAD
    logoutUrl,
    ProfileContext,
    ProfileContextData,
    profileRoute,
=======
    authUrlLogout,
    ProfileContext,
    ProfileContextData,
    RouteContext,
    RouteContextData,
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22
} from '../../../../../../lib'

import styles from './ProfilePanel.module.scss'

interface ProfilePanelProps {
    toggleProfilePanel: () => void
}

const ProfilePanel: FC<ProfilePanelProps> = (props: ProfilePanelProps) => {

    const { profile }: ProfileContextData = useContext(ProfileContext)
    const { getPath  }: RouteContextData = useContext(RouteContext)

    if (!profile) {
        // this should never happen
        return <></>
    }

    const settingsTitle: string = 'Settings'

    return (
        <div className={styles['profile-panel']}>
            <div className={styles.handle}>
                {profile.handle}
            </div>
            <Link
                className={styles.profile}
                onClick={() => props.toggleProfilePanel()}
<<<<<<< HEAD
                to={profileRoute}
            >
                My Profile
            </Link>
            <a href={logoutUrl} className={styles.logout}>
=======
                to={getPath(settingsTitle)}
            >
                {settingsTitle}
            </Link>
            <a href={authUrlLogout} className={styles.logout}>
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22
                Log Out
            </a>
        </div>
    )
}

export default ProfilePanel
