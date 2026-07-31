/* eslint-disable react/jsx-no-bind */

import {
    FC,
    useCallback,
    useMemo,
    useState,
} from 'react'

import {
    BaseModal,
    Button,
} from '~/libs/ui'

import {
    ASSIGNMENT_SOURCES,
    ASSIGNMENT_SOURCE_LABELS,
} from '../../constants'
import {
    Application,
} from '../../models'
import {
    calculateAssignmentRatePerWeek,
    sanitizePositiveNumericInput,
    serializeTentativeAssignmentDate,
    toPositiveInteger,
    toPositiveNumber,
    toPositiveNumberWithMaxDecimalPlaces,
} from '../../utils'
import {
    StartDateTimeInput,
} from '../form'

import styles from './AcceptApplicationModal.module.scss'

export interface AcceptApplicationFormData {
    agreementRate: string
    candidateWiproId?: string
    durationMonths: number
    otherRemarks?: string
    paymentCycle: string
    ratePerHour: string
    source?: string
    startDate: string
    standardHoursPerDay: number
    standardHoursPerWeek: number
    wiproIdEndDate?: string
}

interface AcceptApplicationModalProps {
    application: Application | undefined
    isSubmitting?: boolean
    onCancel: () => void
    onConfirm: (data: AcceptApplicationFormData) => Promise<void> | void
    open: boolean
}

interface ValidationErrors {
    durationMonths?: string
    paymentCycle?: string
    ratePerHour?: string
    startDate?: string
    standardHoursPerDay?: string
}

const AcceptApplicationModal: FC<AcceptApplicationModalProps> = (
    props: AcceptApplicationModalProps,
) => {
    const [candidateWiproId, setCandidateWiproId] = useState<string>('')
    const [durationMonths, setDurationMonths] = useState<string>('')
    const [errors, setErrors] = useState<ValidationErrors>({})
    const [otherRemarks, setOtherRemarks] = useState<string>('')
    const [paymentCycle, setPaymentCycle] = useState<string>('WEEKLY')
    const [ratePerHour, setRatePerHour] = useState<string>('')
    const [source, setSource] = useState<string>('')
    const [startDate, setStartDate] = useState<Date | undefined>()
    const [standardHoursPerDay, setStandardHoursPerDay] = useState<string>('')
    const [wiproIdEndDate, setWiproIdEndDate] = useState<Date | undefined>()

    const isSubmitting = props.isSubmitting === true

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

    const resetState = useCallback((): void => {
        setCandidateWiproId('')
        setDurationMonths('')
        setErrors({})
        setOtherRemarks('')
        setPaymentCycle('WEEKLY')
        setRatePerHour('')
        setSource('')
        setStartDate(undefined)
        setStandardHoursPerDay('')
        setWiproIdEndDate(undefined)
    }, [])

    const handleCancel = useCallback((): void => {
        resetState()
        props.onCancel()
    }, [props, resetState])

    const handleConfirm = useCallback(async (): Promise<void> => {
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
            nextErrors.startDate = 'Billing start date is required.'
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

        await props.onConfirm({
            agreementRate,
            candidateWiproId: candidateWiproId.trim() || undefined,
            durationMonths: parsedDurationMonths,
            otherRemarks: otherRemarks.trim() || undefined,
            paymentCycle: normalizedPaymentCycle,
            ratePerHour: parsedRatePerHour.toString(),
            source: source.trim() || undefined,
            standardHoursPerDay: parsedStandardHoursPerDay,
            standardHoursPerWeek: Number((parsedStandardHoursPerDay * 5).toFixed(2)),
            startDate: serializeTentativeAssignmentDate(startDate),
            wiproIdEndDate: wiproIdEndDate
                ? serializeTentativeAssignmentDate(wiproIdEndDate)
                : undefined,
        })

        resetState()
    }, [
        agreementRate,
        candidateWiproId,
        durationMonths,
        otherRemarks,
        paymentCycle,
        props,
        ratePerHour,
        resetState,
        source,
        standardHoursPerDay,
        startDate,
        wiproIdEndDate,
    ])

    return (
        <BaseModal
            open={props.open}
            onClose={handleCancel}
            title='Accept Application'
            size='lg'
            buttons={(
                <div className={styles.actions}>
                    <Button
                        label='Cancel'
                        onClick={handleCancel}
                        secondary
                    />
                    <Button
                        label={isSubmitting ? 'Saving...' : 'Confirm'}
                        onClick={handleConfirm}
                        primary
                        disabled={isSubmitting}
                    />
                </div>
            )}
        >
            <div className={styles.content}>
                <div className={styles.member}>
                    <span className={styles.label}>Applicant</span>
                    <span className={styles.value}>
                        {`${props.application?.handle || '-'} / ${props.application?.name || '-'}`}
                    </span>
                </div>

                <div className={styles.fieldRow}>
                    <StartDateTimeInput
                        label='Billing start date'
                        preventOpenOnFocus
                        showTimeSelect={false}
                        showTimezone={false}
                        value={startDate}
                        onChange={nextValue => {
                            setStartDate(nextValue || undefined)
                            setErrors(previous => ({
                                ...previous,
                                startDate: undefined,
                            }))
                        }}
                    />
                    {errors.startDate
                        ? <p className={styles.error}>{errors.startDate}</p>
                        : undefined}
                </div>

                <div className={styles.fieldRow}>
                    <label className={styles.label} htmlFor='accept-application-duration-months'>
                        Duration (in months) *
                    </label>
                    <input
                        id='accept-application-duration-months'
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
                    <label className={styles.label} htmlFor='accept-application-rate-per-hour'>
                        Rate per hour *
                    </label>
                    <input
                        id='accept-application-rate-per-hour'
                        className={styles.input}
                        onChange={event => {
                            setRatePerHour(sanitizePositiveNumericInput(event.target.value))
                            setErrors(previous => ({
                                ...previous,
                                ratePerHour: undefined,
                            }))
                        }}
                        inputMode='decimal'
                        pattern='[0-9.]*'
                        type='text'
                        value={ratePerHour}
                    />
                    {errors.ratePerHour
                        ? <p className={styles.error}>{errors.ratePerHour}</p>
                        : undefined}
                </div>

                <div className={styles.fieldRow}>
                    <label className={styles.label} htmlFor='accept-application-standard-hours'>
                        Standard hours per day *
                    </label>
                    <input
                        id='accept-application-standard-hours'
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
                    <label className={styles.label} htmlFor='accept-application-payment-cycle'>
                        Payment cycle *
                    </label>
                    <select
                        id='accept-application-payment-cycle'
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
                    <label className={styles.label} htmlFor='accept-application-remarks'>
                        Other remarks
                    </label>
                    <textarea
                        id='accept-application-remarks'
                        className={styles.textarea}
                        onChange={event => setOtherRemarks(event.target.value)}
                        rows={3}
                        value={otherRemarks}
                    />
                </div>

                <div className={styles.fieldRow}>
                    <label className={styles.label} htmlFor='accept-application-candidate-wipro-id'>
                        Candidate Wipro ID
                    </label>
                    <input
                        id='accept-application-candidate-wipro-id'
                        className={styles.input}
                        onChange={event => setCandidateWiproId(event.target.value)}
                        type='text'
                        value={candidateWiproId}
                    />
                </div>

                <div className={styles.fieldRow}>
                    <StartDateTimeInput
                        label='Wipro ID End Date'
                        preventOpenOnFocus
                        showTimeSelect={false}
                        showTimezone={false}
                        value={wiproIdEndDate}
                        onChange={nextValue => setWiproIdEndDate(nextValue || undefined)}
                    />
                </div>

                <div className={styles.fieldRow}>
                    <label className={styles.label} htmlFor='accept-application-source'>
                        Source
                    </label>
                    <select
                        id='accept-application-source'
                        className={styles.input}
                        onChange={event => setSource(event.target.value)}
                        value={source}
                    >
                        <option value=''>Select source</option>
                        {ASSIGNMENT_SOURCES.map(sourceOption => (
                            <option key={sourceOption} value={sourceOption}>
                                {ASSIGNMENT_SOURCE_LABELS[sourceOption]}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </BaseModal>
    )
}

export default AcceptApplicationModal
