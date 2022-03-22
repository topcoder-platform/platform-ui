import { Dispatch, FC, FormEvent, SetStateAction, useContext, useState } from 'react'

import {
    Button,
    FormDefinition,
    formRenderTextInput,
    formReset,
    formSubmit,
    formValidateAndUpdate,
    PasswordUpdateRequest,
    ProfileContext,
    ProfileContextData,
    UserProfile,
} from '../../../lib'

import { PasswordFieldName, passwordFormDef } from './password-reset-form.config'
import styles from './PasswordReset.module.scss'

export const passwordFormTitle: string = 'Reset Password'

interface PasswordUpdateForm {
    confirmPasssword?: string
    newPassword?: string
    password?: string
}

interface PasswordUpdateProps {
    profilePath: string
}

// TODO: further genericize forms so we're not repeating all this
const PasswordReset: FC<PasswordUpdateProps> = (props: PasswordUpdateProps) => {

    const profileContext: ProfileContextData = useContext(ProfileContext)
    const { profile, updatePassword }: ProfileContextData = profileContext

    const [disableButton, setDisableSave]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(true)

    const [passwordForm, setPasswordForm]: [FormDefinition, Dispatch<SetStateAction<FormDefinition>>]
        = useState<FormDefinition>(passwordFormDef)

    // create the copy of the profile
    const safeProfile: UserProfile = {
        ...(profile as UserProfile),
    }
    const passwordFormDetail: PasswordUpdateForm = {}

    function onChange(event: FormEvent<HTMLFormElement>): void {
        const isValid: boolean = formValidateAndUpdate(event, passwordForm)
        setPasswordForm({ ...passwordForm })
        setDisableSave(!isValid)
    }

    function onReset(): void {
        setPasswordForm({ ...passwordForm })
        formReset(passwordFormDef)
    }

    function onSubmit(event: FormEvent<HTMLFormElement>): void {
        const request: PasswordUpdateRequest = {
            newPassword: passwordFormDetail.newPassword as string,
            password: passwordFormDetail.password as string,
        }
        formSubmit<PasswordUpdateRequest, void>(event, passwordForm, passwordFormTitle, request, save, setDisableSave)
        setPasswordForm({ ...passwordForm })
    }

    function save(updatedPassword: PasswordUpdateRequest): Promise<void> {
        return updatePassword(safeProfile.userId, updatedPassword)
    }

    return (
        <form
            action={''}
            onChange={onChange}
            onSubmit={onSubmit}
        >
            <hr />

            <h6>{passwordFormTitle}</h6>

            <div className={styles['password-form-fields']}>
                {formRenderTextInput(passwordForm, PasswordFieldName.currentPassword)}
                {formRenderTextInput(passwordForm, PasswordFieldName.newPassword)}
                {formRenderTextInput(passwordForm, PasswordFieldName.confirmPassword)}
            </div>

            <div className='form-button-container'>
                <Button
                    buttonStyle='tertiary'
                    label='Back'
                    onClick={onReset}
                    route={props.profilePath}
                    size='xl'
                    tabIndex={-1}
                />
                <Button
                    buttonStyle='secondary'
                    disable={disableButton}
                    label='Save'
                    size='xl'
                    tabIndex={4}
                    type='submit'
                />
            </div>

        </form>
    )
}

export default PasswordReset
