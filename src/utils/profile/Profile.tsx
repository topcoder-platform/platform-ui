import { Dispatch, FC, FormEvent, SetStateAction, useContext, useState } from 'react'
import { NavigateFunction, useNavigate } from 'react-router-dom'

import {
    Button,
    ContentLayout,
    FormDefinition,
    getFormInput,
    getFormValue,
    loginUrl,
    ProfileContext,
    ProfileContextData,
    routeRoot,
    TextInput,
    TextInputModel,
    UserProfileDetail,
    validateAndUpdateForm,
} from '../../lib'
import '../../lib/styles/index.scss'

import { FieldNames, profileFormDef } from './profile-form.config'
import styles from './Profile.module.scss'

export const utilTitle: string = 'Profile'

const Profile: FC<{}> = () => {

    const profileContext: ProfileContextData = useContext(ProfileContext)
    const { profile, updateProfile, updatePassword }: ProfileContextData = profileContext

    const [disableButton, setDisableButton]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(true)

    const [profileForm, setProfileForm]: [FormDefinition, Dispatch<SetStateAction<FormDefinition>>]
        = useState<FormDefinition>(profileFormDef)

    const navigate: NavigateFunction = useNavigate()

    // if we don't have a profile, navigate to the login page
    if (!profile) {
        navigate(loginUrl(routeRoot))
        return <></>
    }

    // need to define this here so the compiler
    // knows that the profile will never be undefined
    const updatedProfile: UserProfileDetail = {
        ...profile,
    }

    function onChange(event: FormEvent<HTMLFormElement>): void {
        const isValid: boolean = validateAndUpdateForm(event, profileForm, setProfileForm)
        setDisableButton(!isValid)
    }

    function onSubmit(event: FormEvent<HTMLFormElement>): void {

        event.preventDefault()

        setDisableButton(true)

        // all the profile fields on this form
        const profileFields: Array<string> = [FieldNames.email, FieldNames.firstName, FieldNames.lastName]

        const formValues: HTMLFormControlsCollection = (event.target as HTMLFormElement).elements

        Object.keys(updatedProfile)
            .filter(key => profileFields.includes(key))
            .forEach(key => (updatedProfile as any)[key] = getFormValue(formValues, key))

        const updatedContext: ProfileContextData = {
            ...profileContext,
            profile: updatedProfile,
        }

        const currentPassword: string = getFormValue(formValues, FieldNames.currentPassword)
        const password: string = getFormValue(formValues, FieldNames.newPassword)

        // TODO: check profile is dirty
        updateProfile(updatedContext)
            .then(() => !!password ? updatePassword(updatedProfile.userId, currentPassword, password) : Promise.resolve())
            .then(() => {
                getFormInput(formValues, FieldNames.currentPassword).value = ''
                getFormInput(formValues, FieldNames.newPassword).value = ''
                getFormInput(formValues, FieldNames.confirmPassword).value = ''
                setDisableButton(false)
            })
    }

    function renderFormField(fieldName: string, currentTabIndex: number): JSX.Element {

        const formField: TextInputModel = (profileForm as any)[fieldName]

        return (
            <TextInput
                {...formField}
                tabIndex={currentTabIndex}
                type={formField.type || 'text'}
                value={(profile as any)[formField.name]}
            />
        )
    }

    let tabIndex: number = 1

    return (
        <ContentLayout title={utilTitle}>

            <form
                action={''}
                onChange={onChange}
                onSubmit={onSubmit}
            >
                <hr />

                <h6>Basic Information</h6>

                <div className={styles['profile-form-fields']}>
                    {renderFormField(FieldNames.firstName, tabIndex++)}
                    {renderFormField(FieldNames.lastName, tabIndex++)}
                    {renderFormField(FieldNames.email, tabIndex++)}
                    {renderFormField(FieldNames.handle, -1)}
                </div>

                <hr />

                <h6>Reset Password</h6>

                <div className={styles['profile-form-fields']}>
                    {renderFormField(FieldNames.currentPassword, tabIndex++)}
                    {renderFormField(FieldNames.newPassword, tabIndex++)}
                    {renderFormField(FieldNames.confirmPassword, tabIndex++)}
                </div>

                <hr />

                <div className='form-button-container'>
                    <Button
                        disable={disableButton}
                        label='Save'
                        size='xl'
                        buttonStyle='secondary'
                        type='submit' />
                </div>

            </form>

        </ContentLayout >
    )
}

export default Profile
