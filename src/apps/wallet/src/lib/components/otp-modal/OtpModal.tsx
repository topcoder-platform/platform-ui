import { toast } from 'react-toastify'
import OTPInput, { InputProps } from 'react-otp-input'
import React, { FC } from 'react'

import { BaseModal, LinkButton, LoadingCircles } from '~/libs/ui'
import { resendOtp, verifyOtp } from '~/apps/wallet/src/lib/services/wallet'

import { OtpVerificationResponse } from '../../models/OtpVerificationResponse'

import styles from './OtpModal.module.scss'

const RESEND_OTP_TIMEOUT = 60000

interface OtpModalProps {
    isOpen: boolean
    key: string
    transactionId: string
    userEmail?: string
    isBlob?: boolean
    onClose: () => void
    onOtpVerified: (data: unknown) => void
}

const OtpModal: FC<OtpModalProps> = (props: OtpModalProps) => {
    const [otp, setOtp] = React.useState('')
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState('')
    const [showResendButton, setShowResendButton] = React.useState(false)

    // eslint-disable-next-line consistent-return
    React.useEffect(() => {
        let timer: NodeJS.Timeout | undefined
        if (props.isOpen) {
            setShowResendButton(false)
            timer = setTimeout(() => {
                setShowResendButton(true)
            }, RESEND_OTP_TIMEOUT)
        }

        return () => {
            if (timer) {
                clearTimeout(timer)
            }
        }
    }, [props.isOpen])

    React.useEffect(() => {
        if (!props.isOpen) {
            setOtp('')
            setError('')
        }
    }, [props.isOpen])

    function handleChange(code: string): void {
        setOtp(code)
        if (code.length === 6) {
            setLoading(true)
            verifyOtp(props.transactionId, code, props.isBlob)
                .then((response: OtpVerificationResponse | Blob) => {
                    setLoading(false)
                    props.onOtpVerified(response)
                })
                .catch((err: Error) => {
                    setLoading(false)
                    setError(err.message)
                })
        } else if (code.length < 6) {
            setError('')
        }
    }

    return (
        <BaseModal
            spacer={false}
            title='CHECK YOUR EMAIL FOR A CODE'
            open
            blockScroll
            onClose={props.onClose}
            size='md'
        >
            <div className={styles['otp-modal']}>
                {error && <p className={styles.error}>{error}</p>}
                <p>
                    For added security we’ve sent a 6-digit code to your
                    {' '}
                    <strong>{props.userEmail ?? '***@gmail.com'}</strong>
                    {' '}
                    email. The code
                    expires shortly, so please enter it soon.
                </p>
                <OTPInput
                    value={otp}
                    numInputs={6}
                    // eslint-disable-next-line react/jsx-no-bind
                    renderInput={(inputProps: InputProps) => <input {...inputProps} className={styles.otpInput} />}
                    onChange={handleChange}
                    inputType='number'
                    shouldAutoFocus
                    inputStyle={styles.otpInput}
                />

                <p>Can&apos;t find the code? Check your spam folder.</p>
                {loading && <LoadingCircles />}
                {!loading && showResendButton && (
                    <LinkButton
                        light={false}
                        label='Resend code'
                        variant='linkblue'
                        size='lg'
                        link
                        onClick={async function onResendOtpClick() {
                            toast.info(
                                'Sending OTP...',
                                { position: toast.POSITION.BOTTOM_RIGHT },
                            )
                            try {
                                await resendOtp(props.transactionId)
                                setShowResendButton(false)
                                setTimeout(() => {
                                    setShowResendButton(true)
                                }, RESEND_OTP_TIMEOUT)
                                toast.success(
                                    'OTP sent successfully.',
                                    { position: toast.POSITION.BOTTOM_RIGHT },
                                )
                            } catch (err: unknown) {
                                toast.error(
                                    (err as Error).message ?? 'Something went wrong. Please try again.',
                                    { position: toast.POSITION.BOTTOM_RIGHT },
                                )
                            }
                        }}
                    />
                )}
            </div>
        </BaseModal>
    )
}

export default OtpModal
