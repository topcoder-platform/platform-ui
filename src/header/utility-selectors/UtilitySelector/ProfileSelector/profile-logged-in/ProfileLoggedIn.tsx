import { Dispatch, FC, SetStateAction, useContext, useState } from 'react'

import { Avatar, LoggingService, ProfileContext, ProfileContextData, XIcon } from '../../../../../lib'

import { ProfilePanel } from './profile-panel'
import styles from './ProfileLoggedIn.module.scss'

const ProfileLoggedIn: FC<{}> = () => {

    const { profile }: ProfileContextData = useContext(ProfileContext)
    const [profilePanelOpen, setProfilePanelOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)
    const logger: LoggingService = new LoggingService()

    if (!profile) {
        logger.logInfo('tried to render the logged in profile w/out a profile')
        return <></>
    }

    function toggleProfilePanel(): void {
        setProfilePanelOpen(!profilePanelOpen)
    }

    return (
        <>
            <a onClick={() => toggleProfilePanel()} >
                <Avatar
                    firstName={profile.firstName}
                    lastName={profile.lastName}
                    handle={profile.handle}
                    photoUrl={profile.photoURL}
                />
                {profilePanelOpen && (
                    <div className={styles.overlay}>
                        <XIcon />
                    </div>
                )}
            </a>
            {profilePanelOpen && <ProfilePanel />}
        </>
    )
}

export default ProfileLoggedIn
