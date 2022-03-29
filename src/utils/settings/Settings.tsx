import classNames from 'classnames'
import { FC, useContext } from 'react'

import {
    authUrlLogin,
    Avatar,
    ContentLayout,
    profileContext,
    ProfileContextData,
    routeRoot,
} from '../../lib'
import '../../lib/styles/index.scss'

import styles from './Settings.module.scss'

export const utilTitle: string = 'Settings'

const Settings: FC<{}> = () => {

    const profileContextData: ProfileContextData = useContext(profileContext)
    const { profile, initialized }: ProfileContextData = profileContextData

    // TODO: create an auth provider
    // if we don't have a profile, don't show the page until it's initialized
    if (!profile) {
        // if we're already initialized, navigate to the login page
        if (initialized) {
            window.location.href = authUrlLogin(routeRoot)
        }
        return <></>
    }

    return (
        <ContentLayout
            title={utilTitle}
            titleClass={classNames('font-tc-white', styles['page-header'])}
        >
            <Avatar
                containerClass={styles['avatar-container']}
                firstName={profile.firstName}
                lastName={profile.lastName}
                handle={profile.handle}
                photoUrl={profile.photoURL}
                size='xl'
            />
        </ContentLayout>
    )
}

export default Settings
