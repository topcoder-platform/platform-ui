import { FC, useMemo } from 'react'

import { InputDatePicker } from '~/libs/ui'

import { DATE_TIME_FORMAT, DEFAULT_TIME_INTERVAL_MINUTES } from '../../../constants/challenge-editor.constants'

import styles from './StartDateTimeInput.module.scss'

export interface StartDateTimeInputProps {
    label: string
    value?: Date | string | null
    onChange: (value: Date | null) => void
    disabled?: boolean
    error?: string
    labelOutside?: boolean
    minDate?: Date | null
    showTimezone?: boolean
    showTimeSelect?: boolean
}

function toDate(value?: Date | string | null): Date | undefined {
    if (!value) {
        return undefined
    }

    const parsedDate = value instanceof Date
        ? value
        : new Date(value)

    if (Number.isNaN(parsedDate.getTime())) {
        return undefined
    }

    return parsedDate
}

export const StartDateTimeInput: FC<StartDateTimeInputProps> = (
    props: StartDateTimeInputProps,
) => {
    const shouldShowTimeSelect = props.showTimeSelect !== false
    const shouldRenderLabelOutside = props.labelOutside === true

    const timezone = useMemo(
        () => Intl.DateTimeFormat()
            .resolvedOptions()
            .timeZone,
        [],
    )

    return (
        <div className={styles.container}>
            {shouldRenderLabelOutside
                ? (
                    <span className={styles.outsideLabel}>
                        {props.label}
                    </span>
                )
                : undefined}

            <InputDatePicker
                classNameWrapper={shouldRenderLabelOutside
                    ? styles.externalLabelDatePicker
                    : undefined}
                date={toDate(props.value)}
                dateFormat={shouldShowTimeSelect ? DATE_TIME_FORMAT : undefined}
                disabled={!!props.disabled}
                error={props.error}
                label={shouldRenderLabelOutside
                    ? ''
                    : props.label}
                minDate={props.minDate}
                onChange={props.onChange}
                showTimeSelect={shouldShowTimeSelect}
                timeIntervals={shouldShowTimeSelect ? DEFAULT_TIME_INTERVAL_MINUTES : undefined}
                timeFormat={shouldShowTimeSelect ? 'HH:mm' : undefined}
            />

            {props.showTimezone === false
                ? undefined
                : (
                    <p className={styles.timezoneText}>
                        Timezone:
                        {' '}
                        {timezone}
                    </p>
                )}
        </div>
    )
}

export default StartDateTimeInput
