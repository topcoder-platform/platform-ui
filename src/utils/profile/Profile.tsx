import { FC, useContext } from 'react'

import {
    ContentLayout,
    FormField,
    ProfileContext,
    ProfileContextData,
    TextInput,
} from '../../lib'

import styles from './Profile.module.scss'

export const utilTitle: string = 'Profile'

const Profile: FC<{}> = () => {

    const { profile }: ProfileContextData = useContext(ProfileContext)

    // if we don't have a profile, we have a problem
    // TODO: figure out how to lock down the profile
    // so that it requires authentication
    if (!profile) {
        return <></>
    }

    // TODO: validation

    let tabIndex: number = 1

    return (
        <ContentLayout title={utilTitle}>

            <h3>Basic Information</h3>

            <div className={styles.profile}>

                <FormField disabled label='Username' tabIndex={-1}>
                    <TextInput name='username' props={{
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

        </ContentLayout >
    )
}

export default Profile
