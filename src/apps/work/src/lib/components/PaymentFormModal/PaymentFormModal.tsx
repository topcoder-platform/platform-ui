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
    BILLING_ACCOUNT_MEMBER_PAYMENT_DETAILS_ENABLED,
} from '../../constants'
import {
    Assignment,
    TimesheetPaymentSummary,
} from '../../models'
import {
    fetchTimesheetPaymentSummary,
} from '../../services'
import {
    calculatePaymentAmount,
    getAssignmentPaymentCycle,
    getAssignmentRatePerHour,
    getAssignmentStandardHoursPerDay,
    getExpectedHoursLabel,
} from '../../utils'
import {
    calculatePaymentChallengeFee,
    formatCurrency,
} from '../../utils/payment.utils'

import styles from './PaymentFormModal.module.scss'

export interface PaymentFormData {
    amount: number
    /** Approved entries this payment consumes, linked once the payment exists. */
    entryIds: string[]
    hoursWorked: number
    remarks?: string
    title: string
}

interface PaymentFormModalProps {
    billingAccountId?: number | string
    billingAccountMarkup?: number
    /** Engagement the assignment belongs to, needed to look up approved hours. */
    engagementId?: number | string
    engagementName?: string
    isSubmitting?: boolean
    member: Assignment | undefined
    onCancel: () => void
    onConfirm: (data: PaymentFormData) => Promise<void> | void
    open: boolean
    projectName?: string
}

interface ValidationErrors {
    fromDate?: string
    hoursWorked?: string
    toDate?: string
}

function normalizeTitleSegment(value?: string): string {
    return String(value || '')
        .trim()
}

function formatTitleDate(value: Date): string {
    return value.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

function formatWorkPeriodTitle(fromDate?: Date | null, toDate?: Date | null): string {
    if (!fromDate || !toDate) {
        return ''
    }

    return `Work Period ${formatTitleDate(fromDate)} - ${formatTitleDate(toDate)}`
}

function buildPaymentTitle(
    projectName?: string,
    engagementName?: string,
    workPeriodTitle?: string,
): string {
    return [
        normalizeTitleSegment(projectName),
        normalizeTitleSegment(engagementName),
        normalizeTitleSegment(workPeriodTitle),
    ]
        .filter(Boolean)
        .join(' - ')
}

function normalizePositiveValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
        return ''
    }

    const parsedValue = Number(value)

    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
        return ''
    }

    return Number(parsedValue.toFixed(2))
        .toString()
}

/** Formats a picked date as the YYYY-MM-DD the timesheet API speaks. */
function formatWorkDate(date: Date): string {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1)
            .padStart(2, '0'),
        String(date.getDate())
            .padStart(2, '0'),
    ].join('-')
}

const DateInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
    (props, ref): JSX.Element => (
        <input
            {...props}
            className={`${styles.input} ${String(props.className || '')}`.trim()}
            placeholder={props.placeholder || 'Select date'}
            readOnly
            ref={ref}
            type='text'
        />
    ),
)

DateInput.displayName = 'DateInput'

const PaymentFormModal: FC<PaymentFormModalProps> = (
    props: PaymentFormModalProps,
) => {
    const isSubmitting = props.isSubmitting === true

    const [errors, setErrors] = useState<ValidationErrors>({})
    const [fromDate, setFromDate] = useState<Date | undefined>(undefined)
    const [remarks, setRemarks] = useState<string>('')
    const [toDate, setToDate] = useState<Date | undefined>(undefined)
    const [summary, setSummary] = useState<TimesheetPaymentSummary | undefined>(undefined)
    const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false)
    const [summaryError, setSummaryError] = useState<string | undefined>(undefined)

    /**
     * Hours come from approved timesheet entries, never from the keyboard. That is what enforces
     * "payment only against approved hours" and "payment hours cannot exceed approved hours": an
     * operator has no field to type a larger number into, so no ceiling check is needed downstream.
     */
    const hoursWorked = summary?.totalHours ?? ''

    const ratePerHour = useMemo(
        () => getAssignmentRatePerHour(props.member || {}),
        [props.member],
    )
    const amount = useMemo(
        () => calculatePaymentAmount(hoursWorked, ratePerHour),
        [hoursWorked, ratePerHour],
    )
    const challengeFee = useMemo(
        () => (BILLING_ACCOUNT_MEMBER_PAYMENT_DETAILS_ENABLED
            ? calculatePaymentChallengeFee(amount, props.billingAccountMarkup)
            : undefined),
        [amount, props.billingAccountMarkup],
    )
    const paymentCycle = useMemo(
        () => getAssignmentPaymentCycle(props.member || {}),
        [props.member],
    )
    const standardHoursPerDay = useMemo(
        () => getAssignmentStandardHoursPerDay(props.member || {}),
        [props.member],
    )
    const expectedHoursLabel = useMemo(
        () => getExpectedHoursLabel(props.member || {}),
        [props.member],
    )
    const paymentTitle = useMemo(
        () => {
            if (!fromDate || !toDate) {
                return ''
            }

            if (fromDate.getTime() > toDate.getTime()) {
                return ''
            }

            return buildPaymentTitle(
                props.projectName,
                props.engagementName,
                formatWorkPeriodTitle(fromDate, toDate),
            )
        },
        [fromDate, props.engagementName, props.projectName, toDate],
    )

    const resetState = useCallback((): void => {
        setErrors({})
        setFromDate(undefined)
        setRemarks('')
        setToDate(undefined)
        setSummary(undefined)
        setSummaryError(undefined)
    }, [])

    useEffect(() => {
        if (!props.open) {
            return
        }

        resetState()
    }, [props.member?.id, props.member?.memberId, props.open, resetState])

    // Approved hours for the picked period. Refetched on every range change, because the totals are
    // period-specific and an already-paid day must drop out of them.
    useEffect(() => {
        let mounted = true

        if (!props.open || !fromDate || !toDate || fromDate.getTime() > toDate.getTime()) {
            setSummary(undefined)
            return () => undefined
        }

        const engagementId = props.engagementId
        const assignmentId = props.member?.id

        if (!engagementId || !assignmentId) {
            setSummary(undefined)
            setSummaryError('Approved timesheet hours cannot be looked up for this assignment.')
            return () => undefined
        }

        setIsLoadingSummary(true)
        setSummaryError(undefined)

        fetchTimesheetPaymentSummary(
            engagementId,
            assignmentId,
            formatWorkDate(fromDate),
            formatWorkDate(toDate),
        )
            .then(loaded => {
                if (mounted) {
                    setSummary(loaded)
                }
            })
            .catch((error: Error) => {
                if (mounted) {
                    setSummary(undefined)
                    setSummaryError(error.message || 'Failed to load approved timesheet hours.')
                }
            })
            .finally(() => {
                if (mounted) {
                    setIsLoadingSummary(false)
                }
            })

        return () => {
            mounted = false
        }
    }, [fromDate, props.engagementId, props.member?.id, props.open, toDate])

    const handleCancel = useCallback((): void => {
        resetState()
        props.onCancel()
    }, [props, resetState])

    // eslint-disable-next-line complexity
    const handleConfirm = useCallback(async (): Promise<void> => {
        const nextErrors: ValidationErrors = {}
        const parsedHoursWorked = Number(hoursWorked)

        if (!fromDate) {
            nextErrors.fromDate = 'From date is required.'
        }

        if (!toDate) {
            nextErrors.toDate = 'To date is required.'
        }

        if (fromDate && toDate && fromDate.getTime() > toDate.getTime()) {
            nextErrors.toDate = 'To date must be the same day or after the from date.'
        }

        if (!paymentTitle.trim()) {
            nextErrors.fromDate = nextErrors.fromDate || 'Payment title cannot be generated from the selected period.'
        }

        if (!Number.isFinite(parsedHoursWorked) || parsedHoursWorked <= 0) {
            nextErrors.hoursWorked = summary && summary.alreadyPaidEntryIds.length > 0
                ? 'Every approved entry in this period has already been paid.'
                : 'There are no approved timesheet entries in this period.'
        }

        if (ratePerHour === undefined || ratePerHour <= 0) {
            nextErrors.hoursWorked = 'Hourly pay rate is required to calculate payment amount.'
        }

        if (amount === undefined || amount <= 0) {
            nextErrors.hoursWorked = nextErrors.hoursWorked || 'Payment amount must be greater than 0.'
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors)
            return
        }

        if (
            !fromDate
            || !toDate
            || fromDate.getTime() > toDate.getTime()
            || !paymentTitle.trim()
            || !Number.isFinite(parsedHoursWorked)
            || parsedHoursWorked <= 0
            || ratePerHour === undefined
            || ratePerHour <= 0
            || amount === undefined
            || amount <= 0
        ) {
            return
        }

        // eslint-disable-next-line no-alert
        if (!window.confirm('Are you sure you want to submit this payment?')) {
            return
        }

        await props.onConfirm({
            amount,
            entryIds: summary?.entryIds ?? [],
            hoursWorked: parsedHoursWorked,
            remarks: remarks.trim() || undefined,
            title: paymentTitle.trim(),
        })

        resetState()
    }, [
        amount,
        fromDate,
        hoursWorked,
        paymentTitle,
        props,
        ratePerHour,
        remarks,
        resetState,
        summary,
        toDate,
    ])

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
                        <span className={styles.infoLabel}>Rate Per Hour</span>
                        <span className={styles.infoValue}>{formatCurrency(ratePerHour)}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Payment Cycle</span>
                        <span className={styles.infoValue}>{paymentCycle}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Standard Hours Per Day</span>
                        <span className={styles.infoValue}>{normalizePositiveValue(standardHoursPerDay) || '-'}</span>
                    </div>
                    {BILLING_ACCOUNT_MEMBER_PAYMENT_DETAILS_ENABLED
                        ? (
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Billing Account</span>
                                <span className={styles.infoValue}>{props.billingAccountId || 'Unavailable'}</span>
                            </div>
                        )
                        : undefined}
                </div>

                <div className={styles.fieldRow}>
                    <span className={styles.label}>
                        From *
                    </span>
                    <DatePicker
                        customInput={<DateInput />}
                        dateFormat='MM/dd/yyyy'
                        disabled={isSubmitting}
                        onChange={date => {
                            setFromDate(date ?? undefined)
                            setErrors(previous => ({
                                ...previous,
                                fromDate: undefined,
                            }))
                        }}
                        placeholderText='From: ...'
                        preventOpenOnFocus
                        portalId='react-date-portal'
                        popperPlacement='bottom-start'
                        selected={fromDate}
                    />

                    {errors.fromDate
                        ? <p className={styles.error}>{errors.fromDate}</p>
                        : undefined}
                </div>

                <div className={styles.fieldRow}>
                    <span className={styles.label}>
                        To *
                    </span>
                    <DatePicker
                        customInput={<DateInput />}
                        dateFormat='MM/dd/yyyy'
                        disabled={isSubmitting}
                        minDate={fromDate || undefined}
                        onChange={date => {
                            setToDate(date ?? undefined)
                            setErrors(previous => ({
                                ...previous,
                                toDate: undefined,
                            }))
                        }}
                        placeholderText='To: ...'
                        preventOpenOnFocus
                        portalId='react-date-portal'
                        popperPlacement='bottom-start'
                        selected={toDate}
                    />
                    {paymentTitle
                        ? (
                            <p className={styles.weekEndingPreview}>
                                {paymentTitle}
                            </p>
                        )
                        : undefined}
                    {errors.toDate
                        ? <p className={styles.error}>{errors.toDate}</p>
                        : undefined}
                </div>

                <div className={styles.fieldRow}>
                    <label className={styles.label} htmlFor='payment-hours-worked'>
                        <span>Hours worked *</span>
                        {expectedHoursLabel
                            ? (
                                <span className={styles.helperText}>
                                    {`* Expected: ${expectedHoursLabel}`}
                                </span>
                            )
                            : undefined}
                    </label>
                    <input
                        id='payment-hours-worked'
                        className={styles.input}
                        readOnly
                        type='text'
                        value={isLoadingSummary ? 'Loading...' : hoursWorked}
                    />
                    <p className={styles.helperText}>
                        {summary
                            ? `${summary.totalDays} approved `
                                + `${summary.totalDays === 1 ? 'day' : 'days'} in this period`
                            : 'Hours come from approved timesheet entries for the selected period.'}
                    </p>
                    {summary && summary.alreadyPaidEntryIds.length > 0
                        ? (
                            <p className={styles.helperText}>
                                {`${summary.alreadyPaidEntryIds.length} approved `}
                                {summary.alreadyPaidEntryIds.length === 1 ? 'entry' : 'entries'}
                                {' in this period '}
                                {summary.alreadyPaidEntryIds.length === 1 ? 'was' : 'were'}
                                {' already paid and '}
                                {summary.alreadyPaidEntryIds.length === 1 ? 'is' : 'are'}
                                {' excluded.'}
                            </p>
                        )
                        : undefined}
                    {summaryError
                        ? <p className={styles.error}>{summaryError}</p>
                        : undefined}
                    {errors.hoursWorked
                        ? <p className={styles.error}>{errors.hoursWorked}</p>
                        : undefined}
                </div>

                <div className={styles.fieldRow}>
                    <label className={styles.label} htmlFor='payment-amount'>
                        Amount
                    </label>
                    <input
                        id='payment-amount'
                        className={`${styles.input} ${styles.readOnlyInput}`}
                        readOnly
                        type='text'
                        value={amount === undefined
                            ? ''
                            : amount.toFixed(2)}
                    />
                    {challengeFee !== undefined
                        ? (
                            <p className={styles.helperText}>
                                <span className={styles.helperLabel}>Fee:</span>
                                {' '}
                                {formatCurrency(challengeFee)}
                            </p>
                        )
                        : undefined}
                </div>

                <div className={styles.fieldRow}>
                    <label className={styles.label} htmlFor='payment-remarks'>
                        Remarks
                    </label>
                    <textarea
                        id='payment-remarks'
                        className={styles.textarea}
                        disabled={isSubmitting}
                        onChange={event => setRemarks(event.target.value)}
                        rows={4}
                        value={remarks}
                    />
                </div>
            </div>
        </BaseModal>
    )
}

export default PaymentFormModal
