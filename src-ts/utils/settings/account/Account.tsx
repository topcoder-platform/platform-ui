/* eslint-disable jsx-a11y/tabindex-no-positive */
import { Dispatch, FC, SetStateAction, useCallback, useContext, useState } from 'react'
import Modal from 'react-responsive-modal'

import {
    Button,
    Card,
    formGetInputFields,
    FormInputModel,
    formOnReset,
    profileContext,
    ProfileContextData,
} from '../../../lib'

import { ChangePassword } from './change-password'
import { EditName, editNameFormDef } from './edit-name'
import styles from './Account.module.scss'

const Account: FC<{}> = () => {

    const profileContextData: ProfileContextData = useContext(profileContext)
    const { profile }: ProfileContextData = profileContextData

    const [editProfileOpen, setEditNameOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [changePasswordOpen, setChangePasswordOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const toggleEditName = useCallback((): void => {
        const inputs: Array<FormInputModel> = formGetInputFields(editNameFormDef.groups || [])
        formOnReset(inputs)
        setEditNameOpen(!editProfileOpen)
    }, [editProfileOpen])

    const toggleChangePassword = useCallback((): void => {
        const inputs: Array<FormInputModel> = formGetInputFields(editNameFormDef.groups || [])
        formOnReset(inputs)
        setChangePasswordOpen(!changePasswordOpen)
    }, [changePasswordOpen])

    // if we don't have a profile, don't show the page
    if (!profile) {
        return <></>
    }

    return (
        <div className={styles.cards}>

            <Card title='Account'>
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
                title='Name'
                onClick={toggleEditName}
            >
                <p>
                    {profile.firstName}
                    {' '}
                    {profile.lastName}
                </p>
                <Button
                    label='edit name'
                    onClick={toggleEditName}
                    tabIndex={1}
                    buttonStyle='secondary'
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
                title='Password'
            >
                <p>
                    *******************
                </p>
                <Button
                    label='change password'
                    onClick={toggleChangePassword}
                    tabIndex={2}
                    buttonStyle='secondary'
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
