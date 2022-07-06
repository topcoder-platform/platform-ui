import { Dispatch, FC, SetStateAction, useContext, useState } from 'react'

import {
    EditNameRequest,
    Form,
    FormDefinition,
    formGetInputModel,
    FormInputModel,
    profileContext,
    ProfileContextData,
    UserProfile,
} from '../../../../lib'
import '../../../../lib/styles/index.scss'

import { EditNameFieldName, editNameFormDef } from './edit-name-form.config'

interface EditNameProps {
    onClose: () => void
}

const EditName: FC<EditNameProps> = (props: EditNameProps) => {

    const profileContextData: ProfileContextData = useContext(profileContext)
    const { profile, updateProfile }: ProfileContextData = profileContextData

    const [profileForm]: [FormDefinition, Dispatch<SetStateAction<FormDefinition>>]
        = useState<FormDefinition>(editNameFormDef)

    function requestGenerator(inputs: ReadonlyArray<FormInputModel>): EditNameRequest {
        const firstName: string = formGetInputModel(inputs, EditNameFieldName.firstName).value as string
        const lastName: string = formGetInputModel(inputs, EditNameFieldName.lastName).value as string
        return {
            firstName,
            lastName,
        }
    }

    function saveProfile(updatedProfile: EditNameRequest): Promise<void> {
        return updateProfile({
            ...profileContextData,
            profile: {
                ...profileContextData.profile as UserProfile,
                firstName: updatedProfile.firstName,
                lastName: updatedProfile.lastName,
            },
        })
            .then(() => {
                props.onClose()
            })
    }

    return (
        <Form
            formDef={profileForm}
            formValues={profile}
            requestGenerator={requestGenerator}
            save={saveProfile}
            onSuccess={props.onClose} />
    )
}

export default EditName
