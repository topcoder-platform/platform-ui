import OTPInput, { InputProps } from 'react-otp-input'
import React, { FC } from 'react'

import { BaseModal, LoadingCircles } from '~/libs/ui'
import { verifyOtp } from '~/apps/wallet/src/lib/services/wallet'

import { OtpVerificationResponse } from '../../models/OtpVerificationResponse'

import styles from './OtpModal.module.scss'

interface OtpModalProps {
    isOpen: boolean
    key: string
    transactionId: string
    userEmail?: string
    onClose: () => void
    onResendClick?: () => void
    onOtpVerified: (data: unknown) => void
}

const OtpModal: FC<OtpModalProps> = (props: OtpModalProps) => {
    const [otp, setOtp] = React.useState('')
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState('')

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
            verifyOtp(props.transactionId, code)
                .then((response: OtpVerificationResponse) => {
                    props.onOtpVerified(response)
                    setLoading(false)
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
                {!loading && (
                    <button type='button' className={styles['resend-btn']} onClick={props.onResendClick}>
                        Resend code
                    </button>
                )}
            </div>
        </BaseModal>
    )
}

export default OtpModal
