import { Dispatch, FC, SetStateAction, useContext, useState } from 'react'

import {
    Form,
    FormDefinition,
    formGetInputModel,
    FormInputModel,
    PasswordUpdateRequest,
    profileContext,
    ProfileContextData,
    UserProfile,
} from '../../../lib'

import { PasswordFieldName, passwordFormDef } from './password-reset-form.config'

interface PasswordUpdateProps {
    readonly onClose: () => void
}

const PasswordReset: FC<PasswordUpdateProps> = (props: PasswordUpdateProps) => {

    const profileContextData: ProfileContextData = useContext(profileContext)
    const { profile, updatePassword }: ProfileContextData = profileContextData

    const [passwordForm]: [FormDefinition, Dispatch<SetStateAction<FormDefinition>>]
        = useState<FormDefinition>(passwordFormDef)

    function requestGenerator(inputs: ReadonlyArray<FormInputModel>): PasswordUpdateRequest {
        const password: string = formGetInputModel(inputs, PasswordFieldName.currentPassword).value as string
        const newPassword: string = formGetInputModel(inputs, PasswordFieldName.newPassword).value as string
        return {
            newPassword,
            password,
        }
    }

    function save(updatedPassword: PasswordUpdateRequest): Promise<void> {
        return updatePassword((profile as UserProfile).userId, updatedPassword)
            .then(() => {
                props.onClose()
            })
    }

    return (
        <Form
            formDef={passwordForm}
            requestGenerator={requestGenerator}
            resetOnError={true}
            save={save}
            succeeded={props.onClose}
        />
    )
}

export default PasswordReset
