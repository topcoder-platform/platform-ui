import OTPInput, { InputProps } from 'react-otp-input'
import React, { FC, useEffect } from 'react'

import { BaseModal, LoadingCircles } from '~/libs/ui'

import styles from './OtpModal.module.scss'

const RESEND_OTP_TIMEOUT = 60000

interface OtpModalProps {
    isOpen: boolean
    error?: string;
    userEmail?: string
    onClose: () => void
    onOtpEntered: (code: string) => void
}

const OtpModal: FC<OtpModalProps> = (props: OtpModalProps) => {
    const [otp, setOtp] = React.useState('')
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState<string>()
    const [, setShowResendButton] = React.useState(false)

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

    useEffect(() => {
        if (!props.isOpen) {
            setOtp('')
            setError('')
        }
    }, [props.isOpen])

    function handleChange(code: string): void {
        setOtp(code)
        if (code.length === 6) {
            setLoading(true)
            props.onOtpEntered(code)
        } else if (code.length < 6) {
            setError('')
        }
    }

    useEffect(() => {
        setError(props.error)
    }, [props.error])

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
                    For added security we&apos;ve sent a 6-digit code to your
                    {' '}
                    <strong className='body-main-bold'>{props.userEmail ?? '***@gmail.com'}</strong>
                    &nbsp;email. The code
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
                {/* {!loading && showResendButton && (
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
                )} */}
            </div>
        </BaseModal>
    )
}

export default OtpModal
