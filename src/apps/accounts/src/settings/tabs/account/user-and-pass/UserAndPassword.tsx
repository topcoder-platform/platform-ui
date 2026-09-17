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
import { SettingSection } from '~/apps/accounts/src/lib'
import {
    getEmailChangeErrorMessage,
    initiateEmailChangeAsync,
    requestEmailChangeOtpAsync,
    verifyEmailChangeOtpAsync,
} from '~/apps/accounts/src/lib/services'

import { ChangeEmailModal, ChangeEmailOtpModal } from './change-email'
import { createUserAndPassFormConfig } from './user-and-pass.form.config'
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
    const [isRequestingOtp, setIsRequestingOtp] = useState<boolean>(false)
    const [isResendingOtp, setIsResendingOtp] = useState<boolean>(false)
    const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false)
    const [isSubmittingEmail, setIsSubmittingEmail] = useState<boolean>(false)
    const [isOtpModalOpen, setIsOtpModalOpen] = useState<boolean>(false)
    const [isChangeEmailModalOpen, setIsChangeEmailModalOpen] = useState<boolean>(false)
    const [otpError, setOtpError] = useState<string>()
    const [changeEmailError, setChangeEmailError] = useState<string>()
    const [emailChangeProof, setEmailChangeProof] = useState<string>()

    /**
     * Requests an ownership code at the current primary email and opens the OTP dialog.
     * @returns a promise resolved after the code request finishes.
     */
    const handleChangeEmailClick = useCallback(async (): Promise<void> => {
        setIsRequestingOtp(true)
        setOtpError(undefined)
        try {
            await requestEmailChangeOtpAsync(props.profile.userId)
            setIsOtpModalOpen(true)
            toast.success(`Verification code sent to ${props.profile.email}.`)
        } catch (error) {
            toast.error(getEmailChangeErrorMessage(
                error,
                'Unable to send a verification code. Please try again.',
            ))
        } finally {
            setIsRequestingOtp(false)
        }
    }, [props.profile.email, props.profile.userId])

    const userAndPassFormConfig = useMemo(
        () => createUserAndPassFormConfig(handleChangeEmailClick, isRequestingOtp),
        [handleChangeEmailClick, isRequestingOtp],
    )

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
            })
            .catch(() => {
                toast.error('Failed to update user consent.')
            })
    }

    /**
     * Verifies a completed current-email OTP and opens the new-address dialog.
     * @param otp six-digit code entered by the member.
     * @returns a promise resolved after identity verification finishes.
     */
    async function handleVerifyOtp(otp: string): Promise<void> {
        setIsVerifyingOtp(true)
        setOtpError(undefined)
        try {
            const response = await verifyEmailChangeOtpAsync(props.profile.userId, otp)
            setEmailChangeProof(response.verificationToken)
            setIsOtpModalOpen(false)
            setIsChangeEmailModalOpen(true)
        } catch (error) {
            setOtpError(getEmailChangeErrorMessage(
                error,
                'The verification code could not be verified.',
            ))
        } finally {
            setIsVerifyingOtp(false)
        }
    }

    /**
     * Sends a replacement ownership code to the current primary email.
     * @returns a promise resolved after the resend request finishes.
     */
    async function handleResendOtp(): Promise<void> {
        setIsResendingOtp(true)
        setOtpError(undefined)
        try {
            await requestEmailChangeOtpAsync(props.profile.userId)
            toast.success(`A new verification code was sent to ${props.profile.email}.`)
        } catch (error) {
            setOtpError(getEmailChangeErrorMessage(
                error,
                'Unable to resend the verification code.',
            ))
        } finally {
            setIsResendingOtp(false)
        }
    }

    /**
     * Sends the final validation link to the proposed new email address.
     * @param email normalized address entered in the change-email dialog.
     * @returns a promise resolved after the validation email request finishes.
     */
    async function handleSubmitNewEmail(email: string): Promise<void> {
        if (!emailChangeProof) {
            setChangeEmailError('Your verification expired. Start the email change again.')
            return
        }

        setIsSubmittingEmail(true)
        setChangeEmailError(undefined)
        try {
            const response = await initiateEmailChangeAsync(
                props.profile.userId,
                email,
                emailChangeProof,
            )
            toast.success(
                `Validation email sent to ${response.email}. Your primary email will change after validation.`,
            )
            setIsChangeEmailModalOpen(false)
            setEmailChangeProof(undefined)
        } catch (error) {
            setChangeEmailError(getEmailChangeErrorMessage(
                error,
                'Unable to start the email change. Please try again.',
            ))
        } finally {
            setIsSubmittingEmail(false)
        }
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
                While your Topcoder handle or username cannot be changed,
                we encourage you to change your password frequently.
            </p>

            <div className={styles.formWrap}>
                <Form
                    action='submit'
                    formDef={userAndPassFormConfig}
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

            <ChangeEmailOtpModal
                email={props.profile.email}
                error={otpError}
                isOpen={isOtpModalOpen}
                isResending={isResendingOtp}
                isVerifying={isVerifyingOtp}
                onClose={function closeOtpModal(): void {
                    if (!isResendingOtp && !isVerifyingOtp) {
                        setIsOtpModalOpen(false)
                        setOtpError(undefined)
                    }
                }}
                onResend={handleResendOtp}
                onVerify={handleVerifyOtp}
            />

            <ChangeEmailModal
                currentEmail={props.profile.email}
                error={changeEmailError}
                isOpen={isChangeEmailModalOpen}
                isSubmitting={isSubmittingEmail}
                onClose={function closeChangeEmailModal(): void {
                    if (!isSubmittingEmail) {
                        setIsChangeEmailModalOpen(false)
                        setChangeEmailError(undefined)
                        setEmailChangeProof(undefined)
                    }
                }}
                onSubmit={handleSubmitNewEmail}
            />
        </Collapsible>
    )
}

export default UserAndPassword
