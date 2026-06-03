/* eslint-disable react/jsx-no-bind */

import {
    FC,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'

import {
    BaseModal,
    Button,
} from '~/libs/ui'

import {
    StartDateTimeInput,
} from '../../../../lib/components/form'
import {
    calculateAssignmentRatePerWeek,
    deserializeTentativeAssignmentDate,
    sanitizePositiveNumericInput,
    serializeTentativeAssignmentDate,
    toPositiveInteger,
    toPositiveNumber,
    toPositiveNumberWithMaxDecimalPlaces,
} from '../../../../lib/utils'

import styles from './AssignmentDetailsModal.module.scss'

export interface AssignmentDetailsFormValue {
    agreementRate: string
    durationMonths: string
    memberHandle: string
    otherRemarks?: string
    paymentCycle: string
    ratePerHour: string
    startDate: string
    standardHoursPerDay: string
    standardHoursPerWeek: string
}

interface AssignmentDetailsModalProps {
    initialValue?: AssignmentDetailsFormValue
    memberHandle?: string
    onCancel: () => void
    onSave: (data: AssignmentDetailsFormValue) => void
    open: boolean
}

interface ValidationErrors {
    durationMonths?: string
    paymentCycle?: string
    ratePerHour?: string
    startDate?: string
    standardHoursPerDay?: string
}

export const AssignmentDetailsModal: FC<AssignmentDetailsModalProps> = (
    props: AssignmentDetailsModalProps,
) => {
    const [durationMonths, setDurationMonths] = useState<string>(props.initialValue?.durationMonths || '')
    const [errors, setErrors] = useState<ValidationErrors>({})
    const [otherRemarks, setOtherRemarks] = useState<string>(props.initialValue?.otherRemarks || '')
    const [paymentCycle, setPaymentCycle] = useState<string>(props.initialValue?.paymentCycle || 'WEEKLY')
    const [ratePerHour, setRatePerHour] = useState<string>(props.initialValue?.ratePerHour || '')
    const [startDate, setStartDate] = useState<Date | undefined>(
        deserializeTentativeAssignmentDate(props.initialValue?.startDate),
    )
    const [standardHoursPerDay, setStandardHoursPerDay] = useState<string>(
        props.initialValue?.standardHoursPerDay || '',
    )

    const timezone = useMemo(
        () => Intl.DateTimeFormat()
            .resolvedOptions()
            .timeZone,
        [],
    )
    const agreementRate = useMemo(
        () => {
            const parsedStandardHoursPerDay = toPositiveNumberWithMaxDecimalPlaces(
                standardHoursPerDay,
                2,
            )

            if (parsedStandardHoursPerDay === undefined) {
                return ''
            }

            return calculateAssignmentRatePerWeek(ratePerHour, parsedStandardHoursPerDay * 5)
        },
        [ratePerHour, standardHoursPerDay],
    )

    useEffect(() => {
        if (!props.open) {
            return
        }

        setDurationMonths(props.initialValue?.durationMonths || '')
        setPaymentCycle(props.initialValue?.paymentCycle || 'WEEKLY')
        setRatePerHour(props.initialValue?.ratePerHour || '')
        setStartDate(deserializeTentativeAssignmentDate(props.initialValue?.startDate))
        setStandardHoursPerDay(props.initialValue?.standardHoursPerDay || '')
        setOtherRemarks(props.initialValue?.otherRemarks || '')
        setErrors({})
    }, [props.initialValue, props.open])

    const handleSave = useCallback((): void => {
        const nextErrors: ValidationErrors = {}
        const parsedDurationMonths = toPositiveInteger(durationMonths)
        const parsedRatePerHour = toPositiveNumber(ratePerHour)
        const parsedStandardHoursPerDay = toPositiveNumberWithMaxDecimalPlaces(
            standardHoursPerDay,
            2,
        )
        const normalizedPaymentCycle = String(paymentCycle || 'WEEKLY')
            .trim()
            .toUpperCase()

        if (!startDate) {
            nextErrors.startDate = 'Engagement start date is required.'
        }

        if (parsedDurationMonths === undefined) {
            nextErrors.durationMonths = 'Duration must be a positive whole number.'
        }

        if (parsedRatePerHour === undefined) {
            nextErrors.ratePerHour = 'Rate per hour must be a positive number.'
        }

        if (parsedStandardHoursPerDay === undefined) {
            nextErrors.standardHoursPerDay = 'Standard hours per day must be a '
                + 'positive number with up to 2 decimal places.'
        }

        if (!['WEEKLY', 'FORTNIGHTLY', 'MONTHLY'].includes(normalizedPaymentCycle)) {
            nextErrors.paymentCycle = 'Payment cycle must be Weekly, Fortnightly, or Monthly.'
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors)
            return
        }

        if (
            !startDate
            || parsedDurationMonths === undefined
            || parsedRatePerHour === undefined
            || parsedStandardHoursPerDay === undefined
        ) {
            return
        }

        props.onSave({
            agreementRate,
            durationMonths: String(parsedDurationMonths),
            memberHandle: props.memberHandle || '',
            otherRemarks: otherRemarks.trim() || undefined,
            paymentCycle: normalizedPaymentCycle,
            ratePerHour: parsedRatePerHour.toString(),
            standardHoursPerDay: String(parsedStandardHoursPerDay),
            standardHoursPerWeek: String(Number((parsedStandardHoursPerDay * 5).toFixed(2))),
            startDate: serializeTentativeAssignmentDate(startDate),
        })
    }, [
        agreementRate,
        durationMonths,
        otherRemarks,
        paymentCycle,
        props,
        ratePerHour,
        standardHoursPerDay,
        startDate,
    ])

    return (
        <BaseModal
            open={props.open}
            onClose={props.onCancel}
            title='Assign Member'
            size='lg'
            buttons={(
                <div className={styles.actions}>
                    <Button
                        label='Cancel'
                        onClick={props.onCancel}
                        secondary
                    />
                    <Button
                        label='Save'
                        onClick={handleSave}
                        primary
                    />
                </div>
            )}
        >
            <div className={styles.content}>
                <div className={styles.memberRow}>
                    <span className={styles.label}>Member</span>
                    <span className={styles.value}>{props.memberHandle || '-'}</span>
                </div>

                <div className={styles.fieldRow}>
                    <p className={styles.timezoneText}>
                        Timezone:
                        {' '}
                        {timezone}
                    </p>
                    <StartDateTimeInput
                        label='Engagement start date *'
                        onChange={value => {
                            setStartDate(value || undefined)
                            setErrors(previous => ({
                                ...previous,
                                startDate: undefined,
                            }))
                        }}
                        preventOpenOnFocus
                        showTimeSelect={false}
                        showTimezone={false}
                        value={startDate}
                    />
                    {errors.startDate
                        ? <p className={styles.error}>{errors.startDate}</p>
                        : undefined}
                </div>

                <div className={styles.fieldRow}>
                    <label className={styles.label} htmlFor='assignment-duration-months'>
                        Duration (in months) *
                    </label>
                    <input
                        id='assignment-duration-months'
                        className={styles.input}
                        inputMode='decimal'
                        onChange={event => {
                            setDurationMonths(sanitizePositiveNumericInput(event.target.value))
                            setErrors(previous => ({
                                ...previous,
                                durationMonths: undefined,
                            }))
                        }}
                        pattern='[0-9.]*'
                        type='text'
                        value={durationMonths}
                    />
                    {errors.durationMonths
                        ? <p className={styles.error}>{errors.durationMonths}</p>
                        : undefined}
                </div>

                <div className={styles.fieldRow}>
                    <label className={styles.label} htmlFor='assignment-rate-per-hour'>
                        Rate per hour *
                    </label>
                    <input
                        id='assignment-rate-per-hour'
                        className={styles.input}
                        inputMode='decimal'
                        onChange={event => {
                            setRatePerHour(sanitizePositiveNumericInput(event.target.value))
                            setErrors(previous => ({
                                ...previous,
                                ratePerHour: undefined,
                            }))
                        }}
                        pattern='[0-9.]*'
                        type='text'
                        value={ratePerHour}
                    />
                    {errors.ratePerHour
                        ? <p className={styles.error}>{errors.ratePerHour}</p>
                        : undefined}
                </div>

                <div className={styles.fieldRow}>
                    <label className={styles.label} htmlFor='assignment-standard-hours'>
                        Standard hours per day *
                    </label>
                    <input
                        id='assignment-standard-hours'
                        className={styles.input}
                        inputMode='decimal'
                        onChange={event => {
                            setStandardHoursPerDay(
                                sanitizePositiveNumericInput(event.target.value, 2),
                            )
                            setErrors(previous => ({
                                ...previous,
                                standardHoursPerDay: undefined,
                            }))
                        }}
                        pattern='[0-9.]*'
                        type='text'
                        value={standardHoursPerDay}
                    />
                    {errors.standardHoursPerDay
                        ? <p className={styles.error}>{errors.standardHoursPerDay}</p>
                        : undefined}
                </div>

                <div className={styles.fieldRow}>
                    <label className={styles.label} htmlFor='assignment-payment-cycle'>
                        Payment cycle *
                    </label>
                    <select
                        id='assignment-payment-cycle'
                        className={styles.input}
                        onChange={event => {
                            setPaymentCycle(event.target.value)
                            setErrors(previous => ({
                                ...previous,
                                paymentCycle: undefined,
                            }))
                        }}
                        value={paymentCycle}
                    >
                        <option value='WEEKLY'>Weekly</option>
                        <option value='FORTNIGHTLY'>Fortnightly</option>
                        <option value='MONTHLY'>Monthly</option>
                    </select>
                    {errors.paymentCycle
                        ? <p className={styles.error}>{errors.paymentCycle}</p>
                        : undefined}
                </div>

                <div className={styles.fieldRow}>
                    <label className={styles.label} htmlFor='assignment-remarks'>
                        Other remarks
                    </label>
                    <textarea
                        id='assignment-remarks'
                        className={styles.textarea}
                        onChange={event => setOtherRemarks(event.target.value)}
                        rows={3}
                        value={otherRemarks}
                    />
                </div>
            </div>
        </BaseModal>
    )
}

export default AssignmentDetailsModal
