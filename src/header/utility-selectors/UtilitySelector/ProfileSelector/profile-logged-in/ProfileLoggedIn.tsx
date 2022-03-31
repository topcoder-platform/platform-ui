import { Dispatch, FC, SetStateAction, useContext, useState } from 'react'

import {
    Avatar,
    ComponentVisible,
    IconOutline,
    logInfo,
    profileContext,
    ProfileContextData,
    useHideClickOutside,
} from '../../../../../lib'

import { ProfilePanel } from './profile-panel'
import styles from './ProfileLoggedIn.module.scss'

interface ProfileLoggedInProps {
    settingsTitle: string
}

const ProfileLoggedIn: FC<ProfileLoggedInProps> = (props: ProfileLoggedInProps) => {

    const { profile }: ProfileContextData = useContext(profileContext)
    const [profilePanelOpen, setProfilePanelOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    const {
        isComponentVisible,
        ref,
        setIsComponentVisible,
    }: ComponentVisible = useHideClickOutside(false)

    if (!profile) {
        logInfo('tried to render the logged in profile w/out a profile')
        return <></>
    }

    function toggleProfilePanel(): void {
        const toggleTo: boolean = !profilePanelOpen
        setProfilePanelOpen(toggleTo)
        setIsComponentVisible(toggleTo)
    }

    if (!isComponentVisible && profilePanelOpen) {
        setProfilePanelOpen(isComponentVisible)
    }

    return (
        <>
            <div
                className={styles['profile-avatar']}
                onClick={toggleProfilePanel}
            >
                <Avatar
                    firstName={profile.firstName}
                    lastName={profile.lastName}
                    handle={profile.handle}
                    photoUrl={profile.photoURL}
                    size='sm'
                />
                {profilePanelOpen && (
                    <div className={styles.overlay}>
                        <IconOutline.XIcon />
                    </div>
                )}
            </div>
            {profilePanelOpen && (
                <ProfilePanel
                    refObject={ref}
                    settingsTitle={props.settingsTitle}
                    toggleProfilePanel={toggleProfilePanel}
                />
            )}
        </>
    )
}

export default ProfileLoggedIn
