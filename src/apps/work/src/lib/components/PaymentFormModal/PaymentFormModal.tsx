/* eslint-disable react/jsx-no-bind */

import {
    FC,
    useCallback,
    useState,
} from 'react'

import {
    BaseModal,
    Button,
} from '~/libs/ui'

import {
    Assignment,
} from '../../models'
import {
    formatCurrency,
} from '../../utils/payment.utils'

import styles from './PaymentFormModal.module.scss'

export interface PaymentFormData {
    amount: number
    remarks?: string
    title: string
}

interface PaymentFormModalProps {
    billingAccountId?: number | string
    isSubmitting?: boolean
    member: Assignment | undefined
    onCancel: () => void
    onConfirm: (data: PaymentFormData) => Promise<void> | void
    open: boolean
}

interface ValidationErrors {
    amount?: string
    title?: string
}

const PaymentFormModal: FC<PaymentFormModalProps> = (
    props: PaymentFormModalProps,
) => {
    const isSubmitting = props.isSubmitting === true

    const [amount, setAmount] = useState<string>('')
    const [errors, setErrors] = useState<ValidationErrors>({})
    const [remarks, setRemarks] = useState<string>('')
    const [title, setTitle] = useState<string>('')

    const resetState = useCallback((): void => {
        setAmount('')
        setErrors({})
        setRemarks('')
        setTitle('')
    }, [])

    const handleCancel = useCallback((): void => {
        resetState()
        props.onCancel()
    }, [props, resetState])

    const handleConfirm = useCallback(async (): Promise<void> => {
        const nextErrors: ValidationErrors = {}
        const parsedAmount = Number(amount)

        if (!title.trim()) {
            nextErrors.title = 'Payment title is required.'
        }

        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            nextErrors.amount = 'Payment amount must be greater than 0.'
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors)
            return
        }

        // eslint-disable-next-line no-alert
        if (!window.confirm('Are you sure you want to submit this payment?')) {
            return
        }

        await props.onConfirm({
            amount: parsedAmount,
            remarks: remarks.trim() || undefined,
            title: title.trim(),
        })

        resetState()
    }, [amount, props, remarks, resetState, title])

    return (
        <BaseModal
            open={props.open}
            onClose={handleCancel}
            title='Create Payment'
            size='lg'
            buttons={(
                <div className={styles.actions}>
                    <Button
                        label='Cancel'
                        onClick={handleCancel}
                        secondary
                    />
                    <Button
                        label={isSubmitting ? 'Processing...' : 'Confirm'}
                        onClick={handleConfirm}
                        primary
                        disabled={isSubmitting}
                    />
                </div>
            )}
        >
            <div className={styles.content}>
                <div className={styles.infoGrid}>
                    <div>
                        <span className={styles.label}>Member</span>
                        <span className={styles.value}>{props.member?.memberHandle || '-'}</span>
                    </div>
                    <div>
                        <span className={styles.label}>Agreed Rate</span>
                        <span className={styles.value}>{formatCurrency(props.member?.agreementRate)}</span>
                    </div>
                    <div>
                        <span className={styles.label}>Billing Account</span>
                        <span className={styles.value}>{props.billingAccountId || 'Unavailable'}</span>
                    </div>
                </div>

                <div className={styles.fieldRow}>
                    <label className={styles.label} htmlFor='payment-title'>
                        Payment title *
                    </label>
                    <input
                        id='payment-title'
                        className={styles.input}
                        onChange={event => {
                            setTitle(event.target.value)
                            setErrors(previous => ({
                                ...previous,
                                title: undefined,
                            }))
                        }}
                        placeholder='Week ending: ...'
                        type='text'
                        value={title}
                    />
                    {errors.title
                        ? <p className={styles.error}>{errors.title}</p>
                        : undefined}
                </div>

                <div className={styles.fieldRow}>
                    <label className={styles.label} htmlFor='payment-amount'>
                        Payment amount *
                    </label>
                    <input
                        id='payment-amount'
                        className={styles.input}
                        min='0'
                        onChange={event => {
                            setAmount(event.target.value)
                            setErrors(previous => ({
                                ...previous,
                                amount: undefined,
                            }))
                        }}
                        step='0.01'
                        type='number'
                        value={amount}
                    />
                    {errors.amount
                        ? <p className={styles.error}>{errors.amount}</p>
                        : undefined}
                </div>

                <div className={styles.fieldRow}>
                    <label className={styles.label} htmlFor='payment-remarks'>
                        Remarks
                    </label>
                    <textarea
                        id='payment-remarks'
                        className={styles.textarea}
                        onChange={event => setRemarks(event.target.value)}
                        rows={3}
                        value={remarks}
                    />
                </div>
            </div>
        </BaseModal>
    )
}

export default PaymentFormModal
