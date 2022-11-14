import { Dispatch, FC, SetStateAction, useCallback, useContext, useState } from 'react'

import {
    ChangePasswordRequest,
    Form,
    FormDefinition,
    formGetInputModel,
    FormInputModel,
    profileContext,
    ProfileContextData,
    UserProfile,
} from '../../../../lib'

import { ChangePasswordFieldName, changePasswordFormDef } from './change-password-form.config'

interface ChangePasswordProps {
    readonly onClose: () => void
}

const ChangePassword: FC<ChangePasswordProps> = (props: ChangePasswordProps) => {

    const profileContextData: ProfileContextData = useContext(profileContext)
    const { profile, changePassword }: ProfileContextData = profileContextData

    const [passwordForm]: [FormDefinition, Dispatch<SetStateAction<FormDefinition>>]
        = useState<FormDefinition>(changePasswordFormDef)

    const requestGenerator = useCallback((
        inputs: ReadonlyArray<FormInputModel>,
    ): ChangePasswordRequest => {
        const password: string
            = formGetInputModel(inputs, ChangePasswordFieldName.currentPassword).value as string
        const newPassword: string
            = formGetInputModel(inputs, ChangePasswordFieldName.newPassword).value as string
        return {
            newPassword,
            password,
        }
    }, [])

    const save = useCallback((updatedPassword: ChangePasswordRequest): Promise<void> => (
        changePassword((profile as UserProfile).userId, updatedPassword)
            .then(() => {
                props.onClose()
            })
    ), [changePassword, profile, props.onClose])

    return (
        <Form
            formDef={passwordForm}
            onSuccess={props.onClose}
            requestGenerator={requestGenerator}
            save={save}
        />
    )
}

export default ChangePassword
