/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable react/destructuring-assignment */
import OTPInput, { InputProps } from 'react-otp-input'
import React from 'react'

import { BaseModal, LoadingCircles } from '~/libs/ui'
import { verifyOtp } from '~/apps/wallet/src/lib/services/wallet'

import styles from './OtpModal.module.scss'

const OtpModal = ({
    isOpen,
    key,
    transactionId,
    onClose,
    onResendClick,
    onOtpVerified,
}: {
    isOpen: boolean
    key: string
    transactionId: string
    onClose: () => void
    onResendClick: () => void
    onOtpVerified: (key: string) => void
}) => {
    const [otp, setOtp] = React.useState('')
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState('')

    React.useEffect(() => {
        if (!isOpen) {
            setOtp('')
            setError('')
        }
    }, [isOpen])

    const handleChange = (code: string) => {
        setOtp(code)
        if (code.length === 6) {
            setLoading(true)
            verifyOtp(transactionId, code)
                .then(() => {
                    setLoading(false)
                    onOtpVerified(key)
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
        <BaseModal spacer={false} title='CHECK YOUR EMAIL FOR A CODE' open blockScroll onClose={onClose} size='md'>
            <div className={styles['otp-modal']}>
                {error && <p className={styles.error}>{error}</p>}
                <p>
                    For added security we’ve sent a 6-digit code to your <strong>***@gmail.com</strong> email. The code
                    expires shortly, so please enter it soon.
                </p>
                <OTPInput
                    value={otp}
                    numInputs={6}
                    renderInput={(inputProps: InputProps) => <input {...inputProps} className={styles.otpInput} />}
                    onChange={handleChange}
                    inputType='number'
                    shouldAutoFocus
                    inputStyle={styles.otpInput}
                />

                <p>Can&apos;t find the code? Check your spam folder.</p>
                {loading && <LoadingCircles />}
                {!loading && (
                    <button type='button' className={styles['resend-btn']} onClick={onResendClick}>
                        Resend code
                    </button>
                )}
            </div>
        </BaseModal>
    )
}

export default OtpModal
