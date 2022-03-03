import { FC, useContext, useState } from 'react'

import { Avatar, ProfileContext, ProfileContextData } from '../../../../../lib'

import { ProfilePanel } from './profile-panel'

const ProfileLoggedIn: FC<{}> = () => {

    const { profile }: ProfileContextData = useContext(ProfileContext)
    const [
        profilePanelOpen,
        setProfilePanelOpen,
    ]: [boolean, React.Dispatch<React.SetStateAction<boolean>>] = useState<boolean>(false)

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
            </a>
            {profilePanelOpen && <ProfilePanel />}
        </>
    )
}

export default ProfileLoggedIn
