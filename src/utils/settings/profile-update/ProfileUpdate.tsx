import { Dispatch, FC, FormEvent, SetStateAction, useContext, useState } from 'react'

import {
    Button,
    FormDefinition,
    formInitializeValues,
    formRenderTextInput,
    formReset,
    formSubmit,
    formValidateAndUpdate,
    ProfileContext,
    ProfileContextData,
    UserProfile,
    UserProfileUpdateRequest,
} from '../../../lib'
import '../../../lib/styles/index.scss'
import { passwordFormTitle } from '../password-reset'

import { ProfileFieldName, profileFormDef } from './profile-update-form.config'
import styles from './ProfileUpdate.module.scss'

export const profileFormTitle: string = 'Profile'

interface ProfileUpdateProps {
    passwordPath: string
}

// TODO: further genericize forms so we're not repeating all this
const ProfileUpdate: FC<ProfileUpdateProps> = (props: ProfileUpdateProps) => {

    const profileContext: ProfileContextData = useContext(ProfileContext)
    const { profile, updateProfile }: ProfileContextData = profileContext

    const [disableSave, setDisableSave]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(true)

    const [profileForm, setProfileForm]: [FormDefinition, Dispatch<SetStateAction<FormDefinition>>]
        = useState<FormDefinition>(profileFormDef)

    // create the copy of the profile
    const safeProfile: UserProfile = {
        ...(profile as UserProfile),
    }

    function onChange(event: FormEvent<HTMLFormElement>): void {
        const isValid: boolean = formValidateAndUpdate(event, profileForm)
        setProfileForm({ ...profileForm })
        setDisableSave(!isValid)
    }

    async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
        await formSubmit<UserProfileUpdateRequest, void>(event, profileForm, profileFormTitle, safeProfile, saveProfile, setDisableSave)
        setProfileForm({ ...profileForm })
    }

    function resetForm(): void {
        formReset(profileForm)
        setProfileForm({ ...profileForm })
    }

    function saveProfile(updatedProfile: UserProfileUpdateRequest): Promise<void> {
        return updateProfile({
            ...profileContext,
            profile: {
                ...profileContext.profile as UserProfile,
                email: updatedProfile.email,
                firstName: updatedProfile.firstName,
                lastName: updatedProfile.lastName,
            },
        })
    }

    formInitializeValues(profileForm, profile)

    return (
        <>
            <form
                action={''}
                onChange={onChange}
                onSubmit={onSubmit}
            >
                <hr />

                <h6>{profileFormTitle}</h6>

                <div className={styles['profile-form-fields']}>
                    {formRenderTextInput(profileForm, ProfileFieldName.firstName)}
                    {formRenderTextInput(profileForm, ProfileFieldName.lastName)}
                    {formRenderTextInput(profileForm, ProfileFieldName.email)}
                    {formRenderTextInput(profileForm, ProfileFieldName.handle)}
                </div>

                <div className='form-button-container'>
                    <Button
                        buttonStyle='secondary'
                        disable={disableSave}
                        label='Save'
                        size='xl'
                        tabIndex={4}
                        type='submit'
                    />
                </div>

            </form>

            <hr />

            <h6>{passwordFormTitle}</h6>

            <div className={styles['profile-form-fields']}>

                <div className='form-button-container'>
                    <Button
                        buttonStyle='tertiary'
                        label='Reset Password'
                        onClick={resetForm}
                        route={props.passwordPath}
                        size='xl'
                        tabIndex={5}
                    />
                </div>

            </div>
        </>
    )
}

export default ProfileUpdate
