import classNames from 'classnames'
import { FC, useContext } from 'react'

import { SETTINGS_TITLE } from '../../config'
import {
    authUrlLogin,
    Avatar,
    Button,
    ContentLayout,
    IconOutline,
    profileContext,
    ProfileContextData,
    routeRoot,
} from '../../lib'
import '../../lib/styles/index.scss'

import styles from './Settings.module.scss'

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

    function editProfile(): void {
        console.debug('edting profile')
    }

    function resetPassword(): void {
        console.debug('resetting password')
    }

    return (
        <ContentLayout
            contentClass={styles.content}
            title={SETTINGS_TITLE}
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

            <div className={styles['page-container']}>

                <h2>Edit your Personal Information and Security</h2>

                <div className={styles['page-content']}>

                    <div className='card'>

                        <div className='card-title'>
                            <div>
                                Basic Information
                            </div>
                            <IconOutline.UserIcon />
                        </div>

                        <Button
                            label='edit'
                            onClick={editProfile}
                            tabIndex={1}
                            buttonStyle='link'
                        />

                    </div>

                    <div className='card'>

                        <div className='card-title'>
                            <div>
                                Reset Password
                            </div>
                            <IconOutline.LockClosedIcon />
                        </div>

                        <Button
                            label='edit'
                            onClick={resetPassword}
                            tabIndex={2}
                            buttonStyle='link'
                        />

                    </div>

                </div>
            </div>

        </ContentLayout>
    )
}

export default Settings
