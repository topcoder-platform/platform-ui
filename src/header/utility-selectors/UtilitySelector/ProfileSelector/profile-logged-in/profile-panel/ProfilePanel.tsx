import { FC, useContext } from 'react'
import { Link } from 'react-router-dom'

import {
    AuthenticationUrlConfig,
    ProfileContext,
    ProfileContextData,
    ProfileRouteConfig,
} from '../../../../../../lib'

import styles from './ProfilePanel.module.scss'

interface ProfilePanelProps {
    toggleProfilePanel: () => void
}

const ProfilePanel: FC<ProfilePanelProps> = (props: ProfilePanelProps) => {

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
            <Link
                className={styles.profile}
                onClick={() => props.toggleProfilePanel()}
                to={ProfileRouteConfig.profile}
            >
                My Profile
            </Link>
            <a href={AuthenticationUrlConfig.logout} className={styles.logout}>
                Log Out
            </a>
        </div>
    )
}

export default ProfilePanel
