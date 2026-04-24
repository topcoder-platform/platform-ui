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
    durationMonths: number
    otherRemarks?: string
    ratePerHour: string
    startDate: string
    standardHoursPerWeek: number
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
    ratePerHour?: string
    startDate?: string
    standardHoursPerWeek?: string
}

const AcceptApplicationModal: FC<AcceptApplicationModalProps> = (
    props: AcceptApplicationModalProps,
) => {
    const [durationMonths, setDurationMonths] = useState<string>('')
    const [errors, setErrors] = useState<ValidationErrors>({})
    const [otherRemarks, setOtherRemarks] = useState<string>('')
    const [ratePerHour, setRatePerHour] = useState<string>('')
    const [startDate, setStartDate] = useState<Date | undefined>()
    const [standardHoursPerWeek, setStandardHoursPerWeek] = useState<string>('')

    const isSubmitting = props.isSubmitting === true

    const timezone = useMemo(
        () => Intl.DateTimeFormat()
            .resolvedOptions()
            .timeZone,
        [],
    )
    const agreementRate = useMemo(
        () => calculateAssignmentRatePerWeek(ratePerHour, standardHoursPerWeek),
        [ratePerHour, standardHoursPerWeek],
    )

    const resetState = useCallback((): void => {
        setDurationMonths('')
        setErrors({})
        setOtherRemarks('')
        setRatePerHour('')
        setStartDate(undefined)
        setStandardHoursPerWeek('')
    }, [])

    const handleCancel = useCallback((): void => {
        resetState()
        props.onCancel()
    }, [props, resetState])

    const handleConfirm = useCallback(async (): Promise<void> => {
        const nextErrors: ValidationErrors = {}
        const parsedDurationMonths = toPositiveInteger(durationMonths)
        const parsedRatePerHour = toPositiveNumber(ratePerHour)
        const parsedStandardHoursPerWeek = toPositiveNumberWithMaxDecimalPlaces(
            standardHoursPerWeek,
            2,
        )

        if (!startDate) {
            nextErrors.startDate = 'Billing start date is required.'
        }

        if (parsedDurationMonths === undefined) {
            nextErrors.durationMonths = 'Duration must be a positive whole number.'
        }

        if (parsedRatePerHour === undefined) {
            nextErrors.ratePerHour = 'Rate per hour must be a positive number.'
        }

        if (parsedStandardHoursPerWeek === undefined) {
            nextErrors.standardHoursPerWeek = 'Standard hours per week must be a '
                + 'positive number with up to 2 decimal places.'
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors)
            return
        }

        if (
            !startDate
            || parsedDurationMonths === undefined
            || parsedRatePerHour === undefined
            || parsedStandardHoursPerWeek === undefined
        ) {
            return
        }

        await props.onConfirm({
            agreementRate,
            durationMonths: parsedDurationMonths,
            otherRemarks: otherRemarks.trim() || undefined,
            ratePerHour: parsedRatePerHour.toString(),
            standardHoursPerWeek: parsedStandardHoursPerWeek,
            startDate: serializeTentativeAssignmentDate(startDate),
        })

        resetState()
    }, [
        agreementRate,
        durationMonths,
        otherRemarks,
        props,
        ratePerHour,
        resetState,
        standardHoursPerWeek,
        startDate,
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
                    <p className={styles.timezoneText}>
                        Timezone:
                        {' '}
                        {timezone}
                    </p>

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
                        Standard hours per week *
                    </label>
                    <input
                        id='accept-application-standard-hours'
                        className={styles.input}
                        inputMode='decimal'
                        onChange={event => {
                            setStandardHoursPerWeek(
                                sanitizePositiveNumericInput(event.target.value, 2),
                            )
                            setErrors(previous => ({
                                ...previous,
                                standardHoursPerWeek: undefined,
                            }))
                        }}
                        pattern='[0-9.]*'
                        type='text'
                        value={standardHoursPerWeek}
                    />
                    {errors.standardHoursPerWeek
                        ? <p className={styles.error}>{errors.standardHoursPerWeek}</p>
                        : undefined}
                </div>

                <div className={styles.fieldRow}>
                    <label className={styles.label} htmlFor='accept-application-rate'>
                        Assignment rate per week *
                    </label>
                    <input
                        id='accept-application-rate'
                        className={styles.input}
                        readOnly
                        type='text'
                        value={agreementRate}
                    />
                    {!agreementRate
                        ? <p className={styles.error}>Assignment rate is calculated after entering hourly details.</p>
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
            </div>
        </BaseModal>
    )
}

export default AcceptApplicationModal
