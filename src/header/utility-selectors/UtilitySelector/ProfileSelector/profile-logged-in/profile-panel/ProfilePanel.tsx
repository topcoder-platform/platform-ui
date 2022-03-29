import { FC, useContext } from 'react'
import { Link } from 'react-router-dom'

import { SETTINGS_TITLE } from '../../../../../../config'
import {
    authUrlLogout,
    profileContext,
    ProfileContextData,
    routeContext,
    RouteContextData,
} from '../../../../../../lib'

import styles from './ProfilePanel.module.scss'

interface ProfilePanelProps {
    toggleProfilePanel: () => void
}

const ProfilePanel: FC<ProfilePanelProps> = (props: ProfilePanelProps) => {

    const { profile }: ProfileContextData = useContext(profileContext)
    const { getPath }: RouteContextData = useContext(routeContext)

    if (!profile) {
        // this should never happen
        return <></>
    }

    return (
        <div className={styles['profile-panel']}>
            <div className={styles.handle}>
                {profile.handle}
            </div>
            <Link
                className={styles.profile}
                onClick={() => props.toggleProfilePanel()}
                to={getPath(SETTINGS_TITLE)}
            >
                {SETTINGS_TITLE}
            </Link>
            <a href={authUrlLogout} className={styles.logout}>
                Log Out
            </a>
        </div>
    )
}

export default ProfilePanel
