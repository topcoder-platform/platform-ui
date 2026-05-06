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
    ratePerHour: string
    startDate: string
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
    ratePerHour?: string
    startDate?: string
    standardHoursPerWeek?: string
}

export const AssignmentDetailsModal: FC<AssignmentDetailsModalProps> = (
    props: AssignmentDetailsModalProps,
) => {
    const [durationMonths, setDurationMonths] = useState<string>(props.initialValue?.durationMonths || '')
    const [errors, setErrors] = useState<ValidationErrors>({})
    const [otherRemarks, setOtherRemarks] = useState<string>(props.initialValue?.otherRemarks || '')
    const [ratePerHour, setRatePerHour] = useState<string>(props.initialValue?.ratePerHour || '')
    const [startDate, setStartDate] = useState<Date | undefined>(
        deserializeTentativeAssignmentDate(props.initialValue?.startDate),
    )
    const [standardHoursPerWeek, setStandardHoursPerWeek] = useState<string>(
        props.initialValue?.standardHoursPerWeek || '',
    )

    const minStartDate = useMemo(() => new Date(), [])
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

    useEffect(() => {
        if (!props.open) {
            return
        }

        setDurationMonths(props.initialValue?.durationMonths || '')
        setRatePerHour(props.initialValue?.ratePerHour || '')
        setStartDate(deserializeTentativeAssignmentDate(props.initialValue?.startDate))
        setStandardHoursPerWeek(props.initialValue?.standardHoursPerWeek || '')
        setOtherRemarks(props.initialValue?.otherRemarks || '')
        setErrors({})
    }, [props.initialValue, props.open])

    const handleSave = useCallback((): void => {
        const nextErrors: ValidationErrors = {}
        const parsedDurationMonths = toPositiveInteger(durationMonths)
        const parsedRatePerHour = toPositiveNumber(ratePerHour)
        const parsedStandardHoursPerWeek = toPositiveNumberWithMaxDecimalPlaces(
            standardHoursPerWeek,
            2,
        )

        if (!startDate) {
            nextErrors.startDate = 'Engagement start date is required.'
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

        props.onSave({
            agreementRate,
            durationMonths: String(parsedDurationMonths),
            memberHandle: props.memberHandle || '',
            otherRemarks: otherRemarks.trim() || undefined,
            ratePerHour: parsedRatePerHour.toString(),
            standardHoursPerWeek: String(parsedStandardHoursPerWeek),
            startDate: serializeTentativeAssignmentDate(startDate),
        })
    }, [
        agreementRate,
        durationMonths,
        otherRemarks,
        props,
        ratePerHour,
        standardHoursPerWeek,
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
                        minDate={minStartDate}
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
                        Standard hours per week *
                    </label>
                    <input
                        id='assignment-standard-hours'
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
                    <label className={styles.label} htmlFor='assignment-rate'>
                        Assignment rate per week *
                    </label>
                    <input
                        id='assignment-rate'
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
