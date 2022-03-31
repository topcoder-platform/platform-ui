import { FC, MutableRefObject, useContext } from 'react'
import { Link } from 'react-router-dom'

import {
    authUrlLogout,
    profileContext,
    ProfileContextData,
    routeContext,
    RouteContextData,
} from '../../../../../../lib'

import styles from './ProfilePanel.module.scss'

interface ProfilePanelProps {
    refObject: MutableRefObject<any>
    settingsTitle: string
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
        <div
            className={styles['profile-panel']}
            ref={props.refObject}
        >
            <div className={styles.handle}>
                {profile.handle}
            </div>
            <Link
                className={styles.profile}
                onClick={() => props.toggleProfilePanel()}
                to={getPath(props.settingsTitle)}
            >
                {props.settingsTitle}
            </Link>
            <a href={authUrlLogout} className={styles.logout}>
                Log Out
            </a>
        </div>
    )
}

export default ProfilePanel
