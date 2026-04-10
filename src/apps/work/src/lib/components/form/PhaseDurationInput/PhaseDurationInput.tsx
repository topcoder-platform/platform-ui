import {
    ChangeEvent,
    FC,
    useEffect,
    useState,
} from 'react'
import classNames from 'classnames'

import {
    convertPhaseHoursMinutesToPhaseDuration,
    getPhaseHoursMinutes,
} from '../../../utils'

import styles from './PhaseDurationInput.module.scss'

export interface PhaseDurationInputProps {
    value?: number
    onChange: (durationMinutes: number) => void
    disabled?: boolean
    label?: string
    error?: string
}

/**
 * Removes any non-digit characters from a duration field value.
 *
 * @param value raw input text entered into the duration field.
 * @returns digits-only string that can be safely parsed as a whole number.
 */
function sanitizeInputValue(value: string): string {
    return value.replace(/\D/g, '')
}

/**
 * Parses a sanitized duration field value into a non-negative integer.
 *
 * Empty values remain undefined so the user can temporarily clear a field
 * while typing a replacement value.
 *
 * @param value digits-only duration input value.
 * @returns parsed integer, or `undefined` when the field is empty.
 */
function parseInputValue(value: string): number | undefined {
    if (!value) {
        return undefined
    }

    const parsedValue = Number(value)
    if (!Number.isFinite(parsedValue)) {
        return undefined
    }

    return Math.max(0, Math.trunc(parsedValue))
}

export const PhaseDurationInput: FC<PhaseDurationInputProps> = (props: PhaseDurationInputProps) => {
    const disabled = props.disabled
    const error = props.error
    const label = props.label
    const value = props.value
    const hoursMinutes = getPhaseHoursMinutes(Number(value) || 0)
    const [hoursInput, setHoursInput] = useState<string>(() => String(hoursMinutes.hours))
    const [minutesInput, setMinutesInput] = useState<string>(() => String(hoursMinutes.minutes))

    useEffect(() => {
        setHoursInput(String(hoursMinutes.hours))
        setMinutesInput(String(hoursMinutes.minutes))
    }, [
        hoursMinutes.hours,
        hoursMinutes.minutes,
    ])

    function handleHoursChange(event: ChangeEvent<HTMLInputElement>): void {
        const nextHoursInput = sanitizeInputValue(event.target.value)
        const nextHours = parseInputValue(nextHoursInput)

        setHoursInput(nextHoursInput)

        if (nextHours === undefined) {
            return
        }

        const nextDuration = convertPhaseHoursMinutesToPhaseDuration({
            hours: nextHours,
            minutes: parseInputValue(minutesInput) ?? hoursMinutes.minutes,
        })

        props.onChange(nextDuration)
    }

    function handleMinutesChange(event: ChangeEvent<HTMLInputElement>): void {
        const nextMinutesInput = sanitizeInputValue(event.target.value)
        const parsedMinutes = parseInputValue(nextMinutesInput)

        if (parsedMinutes === undefined) {
            setMinutesInput('')
            return
        }

        const nextMinutes = Math.max(0, Math.min(59, parsedMinutes))

        setMinutesInput(String(nextMinutes))

        const nextDuration = convertPhaseHoursMinutesToPhaseDuration({
            hours: parseInputValue(hoursInput) ?? hoursMinutes.hours,
            minutes: nextMinutes,
        })

        props.onChange(nextDuration)
    }

    function handleHoursBlur(): void {
        if (!hoursInput) {
            setHoursInput(String(hoursMinutes.hours))
        }
    }

    function handleMinutesBlur(): void {
        if (!minutesInput) {
            setMinutesInput(String(hoursMinutes.minutes))
        }
    }

    return (
        <div className={styles.container}>
            {label
                ? <span className={styles.label}>{label}</span>
                : undefined}

            <div className={styles.fields}>
                <label className={styles.field}>
                    <span className={styles.fieldLabel}>Hours</span>
                    <input
                        aria-label='Phase duration hours'
                        className={classNames(
                            styles.input,
                            error ? styles.error : undefined,
                        )}
                        disabled={disabled}
                        inputMode='numeric'
                        min={0}
                        onBlur={handleHoursBlur}
                        onChange={handleHoursChange}
                        pattern='[0-9]*'
                        type='text'
                        value={hoursInput}
                    />
                </label>

                <label className={styles.field}>
                    <span className={styles.fieldLabel}>Minutes</span>
                    <input
                        aria-label='Phase duration minutes'
                        className={classNames(
                            styles.input,
                            error ? styles.error : undefined,
                        )}
                        disabled={disabled}
                        inputMode='numeric'
                        max={59}
                        min={0}
                        onBlur={handleMinutesBlur}
                        onChange={handleMinutesChange}
                        pattern='[0-9]*'
                        type='text'
                        value={minutesInput}
                    />
                </label>
            </div>

            {error
                ? <div className={styles.errorMessage}>{error}</div>
                : undefined}
        </div>
    )
}

export default PhaseDurationInput
