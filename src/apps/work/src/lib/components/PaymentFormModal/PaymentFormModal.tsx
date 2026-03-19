/* eslint-disable react/jsx-no-bind */

import {
    FC,
    forwardRef,
    InputHTMLAttributes,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

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
    engagementName?: string
    isSubmitting?: boolean
    member: Assignment | undefined
    onCancel: () => void
    onConfirm: (data: PaymentFormData) => Promise<void> | void
    open: boolean
    projectName?: string
}

interface ValidationErrors {
    amount?: string
    weekEnding?: string
}

const SATURDAY_DAY_INDEX = 6

function normalizeTitleSegment(value?: string): string {
    return String(value || '')
        .trim()
}

function formatTitleDate(value: Date): string {
    return value.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

function formatWeekEndingTitle(value?: Date | null): string {
    if (!value) {
        return ''
    }

    return `Week Ending: ${formatTitleDate(value)}`
}

function buildPaymentTitle(
    projectName?: string,
    engagementName?: string,
    weekEndingTitle?: string,
): string {
    return [
        normalizeTitleSegment(projectName),
        normalizeTitleSegment(engagementName),
        normalizeTitleSegment(weekEndingTitle),
    ]
        .filter(Boolean)
        .join(' - ')
}

function getDefaultWeekEndingDate(): Date {
    const defaultDate = new Date()
    defaultDate.setHours(0, 0, 0, 0)

    const daysUntilSaturday = (SATURDAY_DAY_INDEX - defaultDate.getDay() + 7) % 7
    defaultDate.setDate(defaultDate.getDate() + daysUntilSaturday)

    return defaultDate
}

function isSaturday(value?: Date | null): boolean {
    return Boolean(value) && value?.getDay() === SATURDAY_DAY_INDEX
}

const WeekEndingInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
    (props, ref): JSX.Element => (
        <input
            {...props}
            className={`${styles.input} ${String(props.className || '')}`.trim()}
            placeholder='Week ending: ...'
            readOnly
            ref={ref}
            type='text'
        />
    ),
)

WeekEndingInput.displayName = 'WeekEndingInput'

const PaymentFormModal: FC<PaymentFormModalProps> = (
    props: PaymentFormModalProps,
) => {
    const isSubmitting = props.isSubmitting === true

    const [amount, setAmount] = useState<string>('')
    const [errors, setErrors] = useState<ValidationErrors>({})
    const [remarks, setRemarks] = useState<string>('')
    const [weekEndingDate, setWeekEndingDate] = useState<Date | null>(() => getDefaultWeekEndingDate())

    const paymentTitle = useMemo(
        () => {
            if (!isSaturday(weekEndingDate)) {
                return ''
            }

            return buildPaymentTitle(
                props.projectName,
                props.engagementName,
                formatWeekEndingTitle(weekEndingDate),
            )
        },
        [props.engagementName, props.projectName, weekEndingDate],
    )

    const resetState = useCallback((): void => {
        setAmount('')
        setErrors({})
        setRemarks('')
        setWeekEndingDate(getDefaultWeekEndingDate())
    }, [])

    useEffect(() => {
        if (!props.open) {
            return
        }

        resetState()
    }, [props.member?.id, props.member?.memberId, props.open, resetState])

    const handleCancel = useCallback((): void => {
        resetState()
        props.onCancel()
    }, [props, resetState])

    const handleConfirm = useCallback(async (): Promise<void> => {
        const nextErrors: ValidationErrors = {}
        const parsedAmount = Number(amount)

        if (!weekEndingDate) {
            nextErrors.weekEnding = 'Week ending date is required.'
        } else if (!isSaturday(weekEndingDate)) {
            nextErrors.weekEnding = 'Week ending date must be a Saturday.'
        } else if (!paymentTitle.trim()) {
            nextErrors.weekEnding = 'Payment title cannot be generated from week ending.'
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
            title: paymentTitle.trim(),
        })

        resetState()
    }, [amount, paymentTitle, props, remarks, resetState, weekEndingDate])

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
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Member</span>
                        <span className={styles.infoValue}>{props.member?.memberHandle || '-'}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Agreed Rate</span>
                        <span className={styles.infoValue}>{formatCurrency(props.member?.agreementRate)}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Billing Account</span>
                        <span className={styles.infoValue}>{props.billingAccountId || 'Unavailable'}</span>
                    </div>
                </div>

                <div className={styles.fieldRow}>
                    <span className={styles.label}>
                        Week ending *
                    </span>
                    <DatePicker
                        customInput={<WeekEndingInput />}
                        dateFormat='MM/dd/yyyy'
                        disabled={isSubmitting}
                        filterDate={isSaturday}
                        onChange={date => {
                            setWeekEndingDate(date)
                            setErrors(previous => ({
                                ...previous,
                                weekEnding: undefined,
                            }))
                        }}
                        placeholderText='Week ending: ...'
                        portalId='react-date-portal'
                        popperPlacement='bottom-start'
                        selected={weekEndingDate}
                    />
                    {paymentTitle
                        ? (
                            <p className={styles.weekEndingPreview}>
                                {paymentTitle}
                            </p>
                        )
                        : undefined}
                    {errors.weekEnding
                        ? <p className={styles.error}>{errors.weekEnding}</p>
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
