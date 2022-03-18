import { Dispatch, FC, FormEvent, SetStateAction, useContext, useState } from 'react'

import {
    Button,
    FormDefinition,
    formOnSubmit,
    formRenderTextInput,
    formValidateAndUpdate,
    ProfileContext,
    ProfileContextData,
    UserProfile,
    UserProfileDetail,
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

    const [disableButton, setDisableButton]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(true)

    const [profileForm, setProfileForm]: [FormDefinition, Dispatch<SetStateAction<FormDefinition>>]
        = useState<FormDefinition>(profileFormDef)

    // create the copy of the profile
    const safeProfile: UserProfileDetail = {
        ...(profile as UserProfileDetail),
    }

    function onChange(event: FormEvent<HTMLFormElement>): void {
        const isValid: boolean = formValidateAndUpdate(event, profileForm, setProfileForm)
        setDisableButton(!isValid)
    }

    function onSubmit(event: FormEvent<HTMLFormElement>): void {
        formOnSubmit<UserProfile, UserProfile | undefined>(event, profileForm, 'Profile', safeProfile, saveProfile, setDisableButton, setProfileForm)
    }

    function saveProfile(updatedProfile: UserProfile): Promise<UserProfile> {
        return updateProfile(safeProfile.handle, {
            email: updatedProfile.email,
            firstName: updatedProfile.firstName,
            lastName: updatedProfile.lastName,
        })
    }

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
                    {formRenderTextInput(profileFormDef, ProfileFieldName.firstName, profile)}
                    {formRenderTextInput(profileFormDef, ProfileFieldName.lastName, profile)}
                    {formRenderTextInput(profileFormDef, ProfileFieldName.email, profile)}
                    {formRenderTextInput(profileFormDef, ProfileFieldName.handle, profile)}
                </div>

                <div className='form-button-container'>
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

            <hr />

            <h6>{passwordFormTitle}</h6>

            <div className={styles['profile-form-fields']}>

                <div className='form-button-container'>
                    <Button
                        buttonStyle='tertiary'
                        label='Reset Password'
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
