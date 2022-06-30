import { Dispatch, FC, SetStateAction, useContext, useState } from 'react'

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

    function requestGenerator(inputs?: ReadonlyArray<FormInputModel>): ChangePasswordRequest {
        const password: string = formGetInputModel(ChangePasswordFieldName.currentPassword, inputs).value as string
        const newPassword: string = formGetInputModel(ChangePasswordFieldName.newPassword, inputs).value as string
        return {
            newPassword,
            password,
        }
    }

    function save(updatedPassword: ChangePasswordRequest): Promise<void> {
        return changePassword((profile as UserProfile).userId, updatedPassword)
            .then(() => {
                props.onClose()
            })
    }

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
