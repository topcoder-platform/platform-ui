import { Dispatch, FC, FormEvent, SetStateAction, useContext, useState } from 'react'
import { NavigateFunction, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import {
    authUrlLogin,
    Button,
    ContentLayout,
    FormDefinition,
    formGetInput,
    formValidateAndUpdate,
    formValidateAndUpdateInput,
    ProfileContext,
    ProfileContextData,
    routeRoot,
    TextInput,
    TextInputModel,
    UserProfileDetail,
} from '../../lib'
import '../../lib/styles/index.scss'

import { FieldName, profileFormDef } from './profile-form.config'
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
        navigate(authUrlLogin(routeRoot))
        return <></>
    }

    // need to define this here so the compiler
    // knows that the profile will never be undefined
    const updatedProfile: UserProfileDetail = {
        ...profile,
    }

    function onChange(event: FormEvent<HTMLFormElement>): void {
        const isValid: boolean = formValidateAndUpdate(event, profileForm, setProfileForm)
        setDisableButton(!isValid)
    }

    function onSubmit(event: FormEvent<HTMLFormElement>): void {

        event.preventDefault()
        setDisableButton(true) // TODO: display a spinner button instead

        // make a map of the form field defs so we don't have to keep converting
        // the dictionary to an array
        const formFieldDefs: Array<TextInputModel> = Object.keys(profileForm)
            .map(key => profileForm[key])

        // if there are no dirty fields, display a message and stop submitting
        const dirty: TextInputModel | undefined = formFieldDefs.find(fieldDef => !!fieldDef.dirty)
        if (!dirty) {
            toast.info('No changes detected.')
            return
        }

        // get the form values so we can validate them
        const formValues: HTMLFormControlsCollection = (event.target as HTMLFormElement).elements

        // if there are any validation errors, display a message and stop submitting
        const isInvalid: boolean = formFieldDefs
            .map(formField => formGetInput(formValues, formField.name))
            .some(inputField => !formValidateAndUpdateInput(inputField, profileForm, setProfileForm, true))
        if (isInvalid) {
            toast.error('Changes could not be saved. Please resolve errors.')
            return
        }

        /*
            TODO: simplify this form:
            -   make the password form a separate screen so that we don't have to do all this crazy
                dirty checking and dependent validation for the pw fields
            -   create a generic form component that has the onchange and onsubmit logic to be
                shared across all forms
         */

        // all the profile fields on this form
        const profileFields: Array<TextInputModel> = formFieldDefs
            .filter(def => [FieldName.email, FieldName.firstName, FieldName.lastName].includes(def.name as FieldName))

        // set the values for the updated profile
        profileFields.forEach(field => (updatedProfile as any)[field.name] = field.value)

        // update the context
        const updatedContext: ProfileContextData = {
            ...profileContext,
            profile: updatedProfile,
        }

        // don't update the profile if the form isn't dirty
        const profileDirty: boolean = profileFields.some(f => f.dirty)
        const profilePromise: Promise<void> = profileDirty
            ? updateProfile(updatedContext)
            : Promise.resolve()

        // don't update the password if the form isn't complete
        const password: string | undefined = profileFormDef[FieldName.newPassword].value
        const currentPassword: string | undefined = profileFormDef[FieldName.currentPassword].value
        const passwordDirty: boolean = !!password && !!currentPassword
        const passwordPromise: Promise<void> = passwordDirty
            ? updatePassword(updatedProfile.userId, currentPassword as string, password as string)
            : Promise.resolve()

        profilePromise
            .then(() => passwordPromise)
            .then(() => {
                // TODO: expolicit form reset method
                formGetInput(formValues, FieldName.currentPassword).value = ''
                formGetInput(formValues, FieldName.newPassword).value = ''
                formGetInput(formValues, FieldName.confirmPassword).value = ''
                const passwordAndProfileDirty: boolean = passwordDirty && profileDirty
                const successMessage: string = `Your ${profileDirty ? 'Profile' : ''} ${passwordAndProfileDirty ? 'and' : ''} ${passwordDirty ? 'Password' : ''} ${passwordAndProfileDirty ? 'have' : 'has '} been saved.`
                toast.success(successMessage)
            })
            // TODO: global error handling
            .catch(error => toast.error(error.response?.data?.result?.content || error.message || error))
    }

    function renderFormField(fieldName: string, currentTabIndex: number): JSX.Element {

        // TODO: make this part of a generic form renderer
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
                    {renderFormField(FieldName.firstName, tabIndex++)}
                    {renderFormField(FieldName.lastName, tabIndex++)}
                    {renderFormField(FieldName.email, tabIndex++)}
                    {renderFormField(FieldName.handle, -1)}
                </div>

                <hr />

                <h6>Reset Password</h6>

                <div className={styles['profile-form-fields']}>
                    {renderFormField(FieldName.currentPassword, tabIndex++)}
                    {renderFormField(FieldName.newPassword, tabIndex++)}
                    {renderFormField(FieldName.confirmPassword, tabIndex++)}
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
