import { useContext, useState } from 'react'
import Modal from 'react-responsive-modal'

import {
    Button,
    Card,
    formOnReset,
    profileContext,
} from '../../../lib'

import styles from './Account.module.scss'
import { ChangePassword, changePasswordFormDef } from './change-password'
import { EditName, editNameFormDef } from './edit-name'

const Account = () => {
    const profileContextData = useContext(profileContext)
    const { profile } = profileContextData

    const [editProfileOpen, setEditNameOpen] = useState<boolean>(false)
    const [changePasswordOpen, setChangePasswordOpen] = useState<boolean>(false)

    // if we don't have a profile, don't show the page
    if (!profile) {
        return null
    }

    const toggleEditName = (): void => {
        formOnReset(editNameFormDef.inputs)
        setEditNameOpen(!editProfileOpen)
    }

    const toggleChangePassword = (): void => {
        formOnReset(changePasswordFormDef.inputs)
        setChangePasswordOpen(!changePasswordOpen)
    }

    return (
        <div className={styles.cards}>

            <Card title="Account">
                <p>
                    <strong>Email:</strong>
                    {' '}
                    {profile.email}
                </p>
                <p>
                    <strong>Username:</strong>
                    {' '}
                    {profile.handle}
                </p>
            </Card>

            <Card
                title="Name"
                onClick={toggleEditName}
            >
                <p>
                    {profile.firstName}
                    {' '}
                    {profile.lastName}
                </p>
                <Button
                    label="edit name"
                    onClick={toggleEditName}
                    tabIndex={-1}
                    buttonStyle="secondary"
                />
            </Card>

            <Modal
                open={editProfileOpen}
                onClose={toggleEditName}
                classNames={{ modal: 'account-settings-modal' }}
            >
                <EditName onClose={toggleEditName} />
            </Modal>

            <Card
                onClick={toggleChangePassword}
                title="Password"
            >
                <p>
                    *******************
                </p>
                <Button
                    label="change password"
                    onClick={toggleChangePassword}
                    tabIndex={-1}
                    buttonStyle="secondary"
                />
            </Card>

            <Modal
                open={changePasswordOpen}
                onClose={toggleChangePassword}
                classNames={{ modal: 'account-settings-modal' }}
            >
                <ChangePassword onClose={toggleChangePassword} />
            </Modal>

        </div>
    )
}

export default Account
