import { FC, FormEvent, MouseEvent, useContext, useState } from 'react'

import {
    Button,
    ContentLayout,
    FormField,
    ProfileContext,
    ProfileContextData,
    TextInput,
} from '../../lib'
import { UserProfileDetail } from '../../lib/profile-provider/user-profile-detail.model'

import styles from './Profile.module.scss'

export const utilTitle: string = 'Profile'

const Profile: FC<{}> = () => {

    const profileContext: ProfileContextData = useContext(ProfileContext)
    const { profile, updateProfile, updatePassword }: ProfileContextData = profileContext

    const [disableButton, setDisableButton]: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
        = useState<boolean>(false)

    // if we don't have a profile, we have a problem
    // TODO: figure out how to lock down the profile
    // so that it requires authentication
    if (!profile) {
        return <></>
    }

    enum FieldNames {
        confirmPassword = 'confirmPassword',
        currentPassword = 'password',
        email = 'email',
        firstName = 'firstName',
        handle = 'handle',
        lastName = 'lastName',
        newPassword = 'newPassword',
    }

    const updatedProfile: UserProfileDetail = {
        ...profile,
    }

    // TODO: validation

    function getFormValue(formValues: HTMLFormControlsCollection, fieldName: string): string {
        return (formValues.namedItem(fieldName) as HTMLInputElement)?.value
    }

    function onClick(event: MouseEvent<HTMLButtonElement>): void {
        setDisableButton(true)
    }

    function onSubmit(event: FormEvent<HTMLFormElement>): void {

        event.preventDefault()

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
            // if the pw is updated, set it
            .then(() => !!password ? updatePassword(updatedProfile.userId, currentPassword, password) : Promise.resolve())
            .then(() => setDisableButton(false))
    }

    let tabIndex: number = 1

    return (
        <ContentLayout title={utilTitle}>

            <form action={''} onSubmit={onSubmit}>

                <h3>Basic Information</h3>

                <div className={styles.profile}>

                    <FormField disabled label='Username' tabIndex={-1}>
                        <TextInput name={FieldNames.handle} props={{
                            defaultValue: profile.handle,
                            disabled: true,
                        }} />
                    </FormField>

                    <FormField label='Email' tabIndex={tabIndex++}>
                        <TextInput name={FieldNames.email} props={{
                            defaultValue: profile.email,
                        }} />
                    </FormField>

                    <FormField label='First Name' tabIndex={tabIndex++}>
                        <TextInput name={FieldNames.firstName} props={{
                            defaultValue: profile.firstName,
                        }} />
                    </FormField>

                    <FormField label='Last Name' tabIndex={tabIndex++}>
                        <TextInput name={FieldNames.lastName} props={{
                            defaultValue: profile.lastName,
                        }} />
                    </FormField>

                </div>

                <h3>Reset Password</h3>

                <div className={styles.profile}>

                    <FormField label='Current Password' tabIndex={tabIndex++}>
                        <TextInput
                            name={FieldNames.currentPassword}
                            props={{
                                autoComplete: 'off',
                                placeholder: 'type your current password',
                            }}
                            type='password'
                        />
                    </FormField>

                    <FormField label='Password' tabIndex={tabIndex++}>
                        <TextInput
                            name={FieldNames.newPassword}
                            props={{
                                autoComplete: 'off',
                                placeholder: 'type your new password',
                            }}
                            type='password'
                        />
                    </FormField>

                    <FormField label='Confirm Password' tabIndex={tabIndex++}>
                        <TextInput
                            name={FieldNames.confirmPassword}
                            props={{
                                autoComplete: 'off',
                                placeholder: 're-type your new password',
                            }}
                            type='password'
                        />
                    </FormField>
                </div>

                <div>
                    <Button
                        disable={disableButton}
                        label='Save Settings'
                        onClick={(event) => onClick(event)}
                        size='xl'
                        buttonStyle='secondary'
                        type='submit' />
                </div>

            </form>

        </ContentLayout >
    )
}

export default Profile
