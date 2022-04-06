import { FC, useContext } from 'react'

import { SETTINGS_TITLE } from '../../../../config'
import { profileContext, ProfileContextData } from '../../../../lib'
import '../../../../lib/styles/index.scss'

import { ProfileLoggedIn } from './profile-logged-in'
import { ProfileNotLoggedIn } from './profile-not-logged-in'
import styles from './ProfileSelector.module.scss'

const ProfileSelector: FC<{}> = () => {

    const {
        initialized,
        profile,
    }: ProfileContextData = useContext(profileContext)

    // if we're not initialized, don't render anything
    if (!initialized) {
        return <></>
    }

    const isLoggedIn: boolean = !!profile
    return (
        <div className={styles['profile-selector']}>
            {!isLoggedIn && <ProfileNotLoggedIn />}
            {isLoggedIn && <ProfileLoggedIn settingsTitle={SETTINGS_TITLE} />}
        </div>
    )
}

export default ProfileSelector
