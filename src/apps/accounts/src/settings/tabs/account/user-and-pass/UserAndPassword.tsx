import { Dispatch, FC, useCallback, useEffect, useMemo, useState } from 'react'
import { has, trim } from 'lodash'
import { toast } from 'react-toastify'
import { KeyedMutator } from 'swr'

import {
    Collapsible,
    Form,
    FormInputModel,
    FormToggleSwitch,
} from '~/libs/ui'
import {
    updateMemberPasswordAsync,
    updateOrCreateMemberTraitsAsync,
    useMemberTraits,
    UserProfile,
    UserTrait,
    UserTraitIds,
    UserTraits,
} from '~/libs/core'
import { SettingSection, triggerSurvey } from '~/apps/accounts/src/lib'

import { UserAndPassFromConfig } from './user-and-pass.form.config'
import styles from './UserAndPassword.module.scss'

interface UserAndPasswordProps {
    profile: UserProfile
    memberTraits: UserTraits[] | undefined
}

const UserAndPassword: FC<UserAndPasswordProps> = (props: UserAndPasswordProps) => {
    const [formValues, setFormValues]: [any, Dispatch<any>] = useState({
        email: props.profile.email,
        handle: props.profile.handle,
    })

    const personalizationTrait: UserTraits | undefined = useMemo(
        () => props.memberTraits?.find((trait: UserTraits) => trait.traitId === 'personalization'),
        [props.memberTraits],
    )

    const { mutate: mutateTraits }: { mutate: KeyedMutator<any> } = useMemberTraits(props.profile.handle)

    const [userConsent, setUserConsent]: [boolean, Dispatch<boolean>] = useState(false)

    const requestGenerator: (inputs: ReadonlyArray<FormInputModel>) => any
        = useCallback((inputs: ReadonlyArray<FormInputModel>) => {
            const currentPassword: any = inputs[2]
            const newPassword: any = inputs[3]

            return {
                currentPassword: currentPassword.value,
                newPassword: newPassword.value,
                userId: props.profile.userId,
            }
        }, [props.profile.userId])

    useEffect(() => {
        if (personalizationTrait) {
            setUserConsent(
                !!personalizationTrait?.traits.data.find(
                    (trait: UserTrait) => has(trait, 'userConsent') && trait.userConsent === true,
                ),
            )
        }
    }, [personalizationTrait])

    async function onSave(request: any): Promise<void> {
        await updateMemberPasswordAsync(request.userId, request.currentPassword, request.newPassword)
    }

    function handleUserConsentChange(): void {
        updateOrCreateMemberTraitsAsync(props.profile.handle, [{
            categoryName: 'Personalization',
            traitId: 'personalization',
            traits: {
                data: [{
                    userConsent: !userConsent,
                }],
                traitId: UserTraitIds.personalization,
            },
        }])
            .then(() => {
                setUserConsent(!userConsent)
                mutateTraits()
                toast.success('User consent updated successfully.')
                triggerSurvey()
            })
            .catch(() => {
                toast.error('Failed to update user consent.')
            })
    }

    function shouldDisableChangePasswordButton(): boolean {
        // pass reset form validation
        const specialChars: any = /[`!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/
        const currentPassword: any = formValues[2]
        const newPassword: any = formValues[3]
        const reTypeNewPassword: any = formValues[4]

        if (
            trim(currentPassword?.value)
            && trim(newPassword?.value)
            && newPassword.value?.length >= 8
            && (
                /\d/.test(newPassword?.value) || specialChars.test(newPassword?.value)
            )
            && newPassword?.value !== currentPassword?.value
            && trim(reTypeNewPassword?.value)
            && newPassword?.value === reTypeNewPassword?.value) {
            return false
        }

        return true
    }

    function setChangePasswordFormValues(val: any): void {
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
                    resetFormAfterSave
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
