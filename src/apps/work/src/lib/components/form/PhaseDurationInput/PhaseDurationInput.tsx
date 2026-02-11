import {
    ChangeEvent,
    FC,
    useMemo,
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

function normalizeInputValue(value: string): number {
    const parsedValue = Number(value)

    if (!Number.isFinite(parsedValue)) {
        return 0
    }

    return Math.max(0, Math.trunc(parsedValue))
}

export const PhaseDurationInput: FC<PhaseDurationInputProps> = (props: PhaseDurationInputProps) => {
    const disabled = props.disabled
    const error = props.error
    const label = props.label
    const value = props.value

    const hoursMinutes = useMemo(
        () => getPhaseHoursMinutes(Number(value) || 0),
        [value],
    )

    function handleHoursChange(event: ChangeEvent<HTMLInputElement>): void {
        const nextHours = normalizeInputValue(event.target.value)
        const nextDuration = convertPhaseHoursMinutesToPhaseDuration({
            hours: nextHours,
            minutes: hoursMinutes.minutes,
        })

        props.onChange(nextDuration)
    }

    function handleMinutesChange(event: ChangeEvent<HTMLInputElement>): void {
        const nextMinutes = Math.max(0, Math.min(59, normalizeInputValue(event.target.value)))
        const nextDuration = convertPhaseHoursMinutesToPhaseDuration({
            hours: hoursMinutes.hours,
            minutes: nextMinutes,
        })

        props.onChange(nextDuration)
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
                        min={0}
                        onChange={handleHoursChange}
                        type='number'
                        value={hoursMinutes.hours}
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
                        max={59}
                        min={0}
                        onChange={handleMinutesChange}
                        type='number'
                        value={hoursMinutes.minutes}
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
