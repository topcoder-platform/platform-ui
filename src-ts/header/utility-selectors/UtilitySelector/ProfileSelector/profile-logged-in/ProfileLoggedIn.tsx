import { Dispatch, FC, MutableRefObject, SetStateAction, useCallback, useContext, useRef, useState } from 'react'

import {
    Avatar,
    IconOutline,
    logInfo,
    profileContext,
    ProfileContextData,
    useClickOutside,
} from '../../../../../lib'

import { ProfilePanel } from './profile-panel'
import styles from './ProfileLoggedIn.module.scss'

interface ProfileLoggedInProps {
    settingsTitle: string
}

const ProfileLoggedIn: FC<ProfileLoggedInProps> = (props: ProfileLoggedInProps) => {

    const { profile }: ProfileContextData = useContext(profileContext)

    const triggerRef: MutableRefObject<any> = useRef(undefined)
    const [profilePanelOpen, setProfilePanelOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    const toggleProfilePanel: () => void = useCallback(() => {
        setProfilePanelOpen((isOpen: boolean) => !isOpen)
    }, [])

    useClickOutside(triggerRef.current, () => setProfilePanelOpen(false))

    if (!profile) {
        logInfo('tried to render the logged in profile w/out a profile')
        return <></>
    }

    return (
        <>
            <div
                className={styles['profile-avatar']}
                ref={triggerRef}
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
                    <>
                        <div className={styles.overlay}>
                            <IconOutline.XIcon />
                        </div>
                        <ProfilePanel settingsTitle={props.settingsTitle} />
                    </>
                )}
            </div>
        </>
    )
}

export default ProfileLoggedIn
