import { FC, useEffect, useState } from 'react'
import OTPInput, { InputProps } from 'react-otp-input'

import { BaseModal, Button, LoadingCircles } from '~/libs/ui'

import styles from './ChangeEmailOtpModal.module.scss'

const RESEND_DELAY_MS: number = 60_000

interface ChangeEmailOtpModalProps {
    email: string
    error?: string
    isOpen: boolean
    isResending: boolean
    isVerifying: boolean
    onClose: () => void
    onResend: () => Promise<void>
    onVerify: (otp: string) => Promise<void>
}

/**
 * Collects the ownership code sent to the member's current primary email.
 */
const ChangeEmailOtpModal: FC<ChangeEmailOtpModalProps> = (
    props: ChangeEmailOtpModalProps,
) => {
    const [otp, setOtp] = useState<string>('')
    const [canResend, setCanResend] = useState<boolean>(false)
    const [resendSequence, setResendSequence] = useState<number>(0)

    useEffect(() => {
        if (!props.isOpen) {
            setOtp('')
            setCanResend(false)
            return undefined
        }

        const timer: NodeJS.Timeout = setTimeout(() => {
            setCanResend(true)
        }, RESEND_DELAY_MS)

        return () => clearTimeout(timer)
    }, [props.isOpen, resendSequence])

    useEffect(() => {
        if (props.error) {
            setOtp('')
        }
    }, [props.error])

    /**
     * Updates the six OTP inputs and verifies a complete code.
     * @param value digits currently entered by the member.
     * @returns a promise resolved after any complete-code verification request.
     */
    async function handleOtpChange(value: string): Promise<void> {
        const digits: string = value.replace(/\D/g, '')
            .slice(0, 6)
        setOtp(digits)
        if (digits.length === 6 && !props.isVerifying) {
            await props.onVerify(digits)
        }
    }

    /**
     * Requests another code and restarts the resend cooldown.
     * @returns a promise resolved after the resend request completes.
     */
    async function handleResend(): Promise<void> {
        setCanResend(false)
        setOtp('')
        await props.onResend()
        setResendSequence(value => value + 1)
    }

    /**
     * Renders one accessible OTP digit input.
     * @param inputProps properties supplied by react-otp-input.
     * @returns a styled input element for one code digit.
     */
    function renderOtpInput(inputProps: InputProps): JSX.Element {
        return (
            <input
                {...inputProps}
                aria-label='Email verification code digit'
                className={styles.otpInput}
                disabled={props.isVerifying}
            />
        )
    }

    return (
        <BaseModal
            blockScroll
            closeOnOverlayClick={false}
            open={props.isOpen}
            size='md'
            spacer={false}
            title='CHECK YOUR EMAIL FOR A CODE'
            onClose={props.onClose}
        >
            <div className={styles.container}>
                <p>
                    For added security, we sent a 6-digit code to
                    {' '}
                    <strong>{props.email}</strong>
                    . Enter it below before changing your email address.
                </p>

                {props.error && (
                    <p className={styles.error} role='alert'>{props.error}</p>
                )}

                <OTPInput
                    inputType='number'
                    numInputs={6}
                    renderInput={renderOtpInput}
                    shouldAutoFocus
                    value={otp}
                    onChange={handleOtpChange}
                />

                {props.isVerifying && <LoadingCircles />}

                <p>Can&apos;t find the code? Check your spam folder.</p>
                <Button
                    disabled={!canResend || props.isResending || props.isVerifying}
                    label={props.isResending ? 'Sending code…' : 'Resend code'}
                    link
                    noCaps
                    onClick={handleResend}
                />
            </div>
        </BaseModal>
    )
}

export default ChangeEmailOtpModal
