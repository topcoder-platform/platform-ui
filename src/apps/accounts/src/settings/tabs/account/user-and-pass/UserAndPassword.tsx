import { Dispatch, FC, useCallback, useState } from 'react'

import { Collapsible, Form, FormInputModel, FormToggleSwitch } from '~/libs/ui'
import { UserProfile } from '~/libs/core'
import { SettingSection } from '~/apps/accounts/src/lib'

import { UserAndPassFromConfig } from './user-and-pass.form.config'
import styles from './UserAndPassword.module.scss'

interface UserAndPasswordProps {
    profile: UserProfile
}

const UserAndPassword: FC<UserAndPasswordProps> = (props: UserAndPasswordProps) => {
    const [formValues, setFormValues]: [any, Dispatch<any>] = useState({
        email: props.profile.email,
        handle: props.profile.handle,
    })

    const [userConsent, setUserConsent]: [boolean, Dispatch<boolean>] = useState(false)

    const requestGenerator: (inputs: ReadonlyArray<FormInputModel>) => any
        = useCallback((inputs: ReadonlyArray<FormInputModel>) => {
            console.log('inputs', inputs)
            return {}
        }, [])

    async function onSave(val: any): Promise<void> {
        console.log('onSave', val)
    }

    function handleUserConsentChange(event: any): void {
        console.log('handleUserConsentChange', event)
        setUserConsent(!userConsent)
    }

    function shouldDisableChangePasswordButton(): boolean {
        // pass reset form validation
        return true
    }

    function setChangePasswordFormValues(val: any): void {
        console.log('setChangePasswordFormValues', val)
        setFormValues({
            ...formValues,
            ...val,
        })
    }

    return (
        <Collapsible
            header={<h3>Username & Password</h3>}
            containerClass={styles.container}
            contentClass={styles.content}
        >
            <p>
                While your Topcoder handle or username and your email cannot be changed,
                we encourage to change your password frequently.
            </p>

            <div className={styles.formWrap}>
                <Form
                    action='submit'
                    formDef={UserAndPassFromConfig}
                    formValues={formValues}
                    requestGenerator={requestGenerator}
                    save={onSave}
                    shouldDisableButton={shouldDisableChangePasswordButton}
                    onChange={setChangePasswordFormValues}
                />

                <SettingSection
                    title='User Consent'
                    infoText='I allow Topcoder to use my information to make my experience more personal.'
                    actionElement={(
                        <FormToggleSwitch
                            name='userConsent'
                            onChange={handleUserConsentChange}
                            value={userConsent}
                        />
                    )}
                />
            </div>
        </Collapsible>
    )
}

export default UserAndPassword
