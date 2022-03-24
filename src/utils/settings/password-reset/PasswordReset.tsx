import { Dispatch, FC, SetStateAction, useContext, useState } from 'react'

import {
    Form,
    FormButton,
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
    readonly profilePath: string
}

const PasswordReset: FC<PasswordUpdateProps> = (props: PasswordUpdateProps) => {

    const profileContextData: ProfileContextData = useContext(profileContext)
    const { profile, updatePassword }: ProfileContextData = profileContextData

    const [passwordForm]: [FormDefinition, Dispatch<SetStateAction<FormDefinition>>]
        = useState<FormDefinition>(passwordFormDef)

    // set the profile path on the button
    const backButton: FormButton = passwordForm.buttons.find(b => b.label === 'Back') as FormButton
    backButton.route  = props.profilePath

    function requestGenerator(inputs: Array<FormInputModel>): PasswordUpdateRequest {
        const password: string =  formGetInputModel(inputs, PasswordFieldName.currentPassword).value as string
        const newPassword: string = formGetInputModel(inputs, PasswordFieldName.newPassword).value as string
        return {
            newPassword,
            password,
        }
    }

    function save(updatedPassword: PasswordUpdateRequest): Promise<void> {
        return updatePassword((profile as UserProfile).userId, updatedPassword)
    }

    return (
        <Form
            formDef={passwordForm}
            requestGenerator={requestGenerator}
            resetOnError={true}
            save={save}
        />
    )
}

export default PasswordReset
