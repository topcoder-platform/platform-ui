import { Dispatch, FC, SetStateAction, useContext, useState } from 'react'

import {
    Form,
    FormDefinition,
    formGetInputModel,
    FormInputModel,
    profileContext,
    ProfileContextData,
    UserProfile,
    UserProfileUpdateRequest,
} from '../../../lib'
import '../../../lib/styles/index.scss'

import { ProfileFieldName, profileFormDef } from './profile-update-form.config'

interface ProfileUpdateProps {
    onClose: () => void
}

const ProfileUpdate: FC<ProfileUpdateProps> = (props: ProfileUpdateProps) => {

    const profileContextData: ProfileContextData = useContext(profileContext)
    const { profile, updateProfile }: ProfileContextData = profileContextData

    const [profileForm]: [FormDefinition, Dispatch<SetStateAction<FormDefinition>>]
        = useState<FormDefinition>(profileFormDef)

    function requestGenerator(inputs: ReadonlyArray<FormInputModel>): UserProfileUpdateRequest {
        const email: string = formGetInputModel(inputs, ProfileFieldName.email).value as string
        const firstName: string = formGetInputModel(inputs, ProfileFieldName.firstName).value as string
        const lastName: string = formGetInputModel(inputs, ProfileFieldName.lastName).value as string
        return {
            email,
            firstName,
            lastName,
        }
    }

    function saveProfile(updatedProfile: UserProfileUpdateRequest): Promise<void> {
        return updateProfile({
            ...profileContextData,
            profile: {
                ...profileContextData.profile as UserProfile,
                email: updatedProfile.email,
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
            resetOnError={false}
            save={saveProfile}
            succeeded={props.onClose} />
    )
}

export default ProfileUpdate
