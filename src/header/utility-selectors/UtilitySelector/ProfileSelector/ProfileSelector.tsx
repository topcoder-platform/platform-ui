import { FC, useContext } from 'react'

import { ProfileContext, ProfileContextData } from '../../../../lib'
import '../../../../lib/styles/index.scss'

import { ProfileLoggedIn } from './profile-logged-in'
import { ProfileNotLoggedIn } from './profile-not-logged-in'
import styles from './ProfileSelector.module.scss'

const ProfileSelector: FC<{}> = () => {

    const {
        initialized,
        profile,
    }: ProfileContextData = useContext(ProfileContext)

    // if we're not initialized, don't render anything
    if (!initialized) {
        return <></>
    }

    const isLoggedIn: boolean = !!profile
    return (
        <div className={styles['profile-selector']}>
            {!isLoggedIn && <ProfileNotLoggedIn />}
            {isLoggedIn && <ProfileLoggedIn />}
        </div>
    )
}

export default ProfileSelector
