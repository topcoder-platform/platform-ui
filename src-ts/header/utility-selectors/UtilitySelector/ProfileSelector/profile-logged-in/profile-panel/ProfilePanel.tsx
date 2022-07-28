import classNames from 'classnames'
import { FC, useContext } from 'react'
import { NavigateFunction, useNavigate } from 'react-router-dom'

import {
    authUrlLogout,
    IconOutline,
    profileContext,
    ProfileContextData,
    routeContext,
    RouteContextData,
    TooltipArrowIcon,
} from '../../../../../../lib'

import styles from './ProfilePanel.module.scss'

interface ProfilePanelProps {
    settingsTitle: string
}

const ProfilePanel: FC<ProfilePanelProps> = (props: ProfilePanelProps) => {

    const { profile }: ProfileContextData = useContext(profileContext)
    const { getPath }: RouteContextData = useContext(routeContext)

    const navigate: NavigateFunction = useNavigate()

    if (!profile) {
        // this should never happen
        return <></>
    }

    function goToAccount(): void {
        navigate(getPath(props.settingsTitle))
    }

    const name: string = `${profile.firstName} ${profile.lastName?.substring(0, 1)}${!!profile.lastName ? '.' : undefined}`

    return (
        <div className={styles['profile-panel']}>
            <div className={styles['arrow-tip']}>
                <TooltipArrowIcon />
            </div>
            <div className={styles.handle}>
                {name}
            </div>
            <hr />
            <div className='nav-items'>
                <div
                    className={classNames(styles.profile, styles['nav-item'])}
                    onClick={goToAccount}
                >
                    <span className={styles.icon}>
                        <IconOutline.CogIcon />
                    </span>
                    <span>
                        {props.settingsTitle}
                    </span>
                </div>
                <a
                    href={authUrlLogout}
                    className={classNames(styles.logout, styles['nav-item'])}
                >
                    <span className={styles.icon}>
                        <IconOutline.LogoutIcon />
                    </span>
                    <span>Log Out</span>
                </a>
            </div>
        </div>
    )
}

export default ProfilePanel
