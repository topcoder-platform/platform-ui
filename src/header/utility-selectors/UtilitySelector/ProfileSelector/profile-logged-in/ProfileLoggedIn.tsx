import { Dispatch, FC, SetStateAction, useContext, useState } from 'react'

import { Avatar, ProfileContext, ProfileContextData, XIcon } from '../../../../../lib'

import { ProfilePanel } from './profile-panel'
import styles from './ProfileLoggedIn.module.scss'

const ProfileLoggedIn: FC<{}> = () => {

    const { profile }: ProfileContextData = useContext(ProfileContext)
    const [profilePanelOpen, setProfilePanelOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    if (!profile) {
        // TODO: this should never happen b/c the parent should change to not display it
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
