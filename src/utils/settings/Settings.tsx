import classNames from 'classnames'
import { Dispatch, FC, SetStateAction, useContext, useState } from 'react'
import Modal from 'react-responsive-modal'
import { NavigateFunction, useNavigate } from 'react-router-dom'

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

import { PasswordReset } from './password-reset'
import { ProfileUpdate } from './profile-update'
import styles from './Settings.module.scss'

const Settings: FC<{}> = () => {

    const profileContextData: ProfileContextData = useContext(profileContext)
    const { profile, initialized }: ProfileContextData = profileContextData

    const [editProfileOpen, setEditProfileOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)
    const [resetPasswordOpen, setResetPasswordOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    const navigate: NavigateFunction = useNavigate()

    // TODO: create an auth provider
    // if we don't have a profile, don't show the page until it's initialized
    if (!profile) {
        // if we're already initialized, navigate to the login page
        if (initialized) {
            window.location.href = authUrlLogin(routeRoot)
        }
        return <></>
    }

    function navigateBack(): void {
        navigate(-1)
    }

    function toggleEditProfile(): void {
        setEditProfileOpen(!editProfileOpen)
    }

    function toggleResetPassword(): void {
        setResetPasswordOpen(!resetPasswordOpen)
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
                            onClick={toggleEditProfile}
                            tabIndex={1}
                            buttonStyle='link'
                        />

                    </div>

                    <Modal
                        center
                        open={editProfileOpen}
                        onClose={toggleEditProfile}
                    >
                        <ProfileUpdate onClose={toggleEditProfile} />
                    </Modal>

                    <div className='card'>

                        <div className='card-title'>
                            <div>
                                Reset Password
                            </div>
                            <IconOutline.LockClosedIcon />
                        </div>

                        <Button
                            label='edit'
                            onClick={toggleResetPassword}
                            tabIndex={2}
                            buttonStyle='link'
                        />

                    </div>

                    <Modal
                        center
                        open={resetPasswordOpen}
                        onClose={toggleResetPassword}
                    >
                        <PasswordReset onClose={toggleResetPassword} />
                    </Modal>

                </div>

                <div className='button-container-outer'>
                    <div className='button-container-inner'>
                        <Button
                            buttonStyle='secondary'
                            label='Back'
                            onClick={navigateBack}
                            tabIndex={3}
                        />
                    </div>
                </div>

            </div>

        </ContentLayout>
    )
}

export default Settings
