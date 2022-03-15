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
    const { profile, updateProfile }: ProfileContextData = profileContext

    const [disableButton, setDisableButton]: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
        = useState<boolean>(false)

    // if we don't have a profile, we have a problem
    // TODO: figure out how to lock down the profile
    // so that it requires authentication
    if (!profile) {
        return <></>
    }

    const updatedProfile: UserProfileDetail = {
        ...profile,
    }

    // TODO: validation

    function onClick(event: MouseEvent<HTMLButtonElement>): void {
        setDisableButton(true)
    }

    function onSubmit(event: FormEvent<HTMLFormElement>): void {

        event.preventDefault()

        // all the profile fields on this form
        const profileFields: Array<string> = ['email', 'firstName', 'lastName']

        const formValues: HTMLFormControlsCollection = (event.target as HTMLFormElement).elements

        Object.keys(updatedProfile)
            .filter(key => profileFields.includes(key))
            .map(key => ({
                input: formValues.namedItem(key) as HTMLInputElement,
                key,
            }))
            .forEach(field => (updatedProfile as any)[field.key] = field.input.value)

        const updatedContext: ProfileContextData = {
            ...profileContext,
            profile: updatedProfile,
        }

        updateProfile(updatedContext)
            .then(() => setDisableButton(false))
    }

    let tabIndex: number = 1

    return (
        <ContentLayout title={utilTitle}>

            <form action={''} onSubmit={onSubmit}>

                <h3>Basic Information</h3>

                <div className={styles.profile}>

                    <FormField disabled label='Username' tabIndex={-1}>
                        <TextInput name='handle' props={{
                            defaultValue: profile.handle,
                            disabled: true,
                        }} />
                    </FormField>

                    <FormField label='Email' tabIndex={tabIndex++}>
                        <TextInput name='email' props={{
                            defaultValue: profile.email,
                        }} />
                    </FormField>

                    <FormField label='First Name' tabIndex={tabIndex++}>
                        <TextInput name='firstName' props={{
                            defaultValue: profile.firstName,
                        }} />
                    </FormField>

                    <FormField label='Last Name' tabIndex={tabIndex++}>
                        <TextInput name='lastName' props={{
                            defaultValue: profile.lastName,
                        }} />
                    </FormField>

                </div>

                <h3>Reset Password</h3>

                <div className={styles.profile}>

                    <FormField label='Current Password' tabIndex={tabIndex++}>
                        <TextInput name='currentPassword' props={{
                            autoComplete: 'off',
                            placeholder: 'type your current password',
                        }} />
                    </FormField>

                    <FormField label='Password' tabIndex={tabIndex++}>
                        <TextInput name='password' props={{
                            autoComplete: 'off',
                            placeholder: 'type your new password',
                        }} />
                    </FormField>

                    <FormField label='Confirm Password' tabIndex={tabIndex++}>
                        <TextInput name='confirmPassword' props={{
                            autoComplete: 'off',
                            placeholder: 're-type your new password',
                        }} />
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
