import { FC, useContext } from 'react'
import { Link } from 'react-router-dom'

import {
    authUrlLogout,
    ProfileContext,
    ProfileContextData,
    RouteContext,
    RouteContextData,
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
                to={getPath(settingsTitle)}
            >
                {settingsTitle}
            </Link>
            <a href={authUrlLogout} className={styles.logout}>
                Log Out
            </a>
        </div>
    )
}

export default ProfilePanel
