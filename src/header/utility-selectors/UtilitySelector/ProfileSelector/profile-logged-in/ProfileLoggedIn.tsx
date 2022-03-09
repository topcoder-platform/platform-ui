import { FC, useContext, useState } from 'react'

import { Avatar, LoggingService, ProfileContext, ProfileContextData } from '../../../../../lib'

import { ProfilePanel } from './profile-panel'
import styles from './ProfileLoggedIn.module.scss'

const ProfileLoggedIn: FC<{}> = () => {

    const { profile }: ProfileContextData = useContext(ProfileContext)
    const [
        profilePanelOpen,
        setProfilePanelOpen,
    ]: [boolean, React.Dispatch<React.SetStateAction<boolean>>] = useState<boolean>(false)
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
                        {/* TODO: import svg from library */}
                        <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                            <path d='M6 18L18 6M6 6L18 18' stroke='#137D60' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
                        </svg>
                    </div>
                )}
            </a>
            {profilePanelOpen && <ProfilePanel />}
        </>
    )
}

export default ProfileLoggedIn
