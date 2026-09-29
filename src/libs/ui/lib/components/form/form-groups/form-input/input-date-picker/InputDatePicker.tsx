/* eslint-disable react/jsx-no-bind */
import { FC, forwardRef, KeyboardEvent, useRef, useState } from 'react'
import { getMonth, getYear } from 'date-fns'
import { range } from 'lodash'
import DatePicker, { ReactDatePicker } from 'react-datepicker'
import classNames from 'classnames'
import 'react-datepicker/dist/react-datepicker.css'

import { InputWrapper } from '../input-wrapper'
import { IconOutline } from '../../../../svgs'

import styles from './InputDatePicker.module.scss'

interface InputDatePickerProps {
    date: Date | undefined | null
    onChange: (date: Date | null) => void
    onBlur?: () => void
    readonly className?: string
    readonly dateFormat?: string | string[]
    readonly dirty?: boolean
    readonly disabled: boolean
    readonly error?: string
    readonly hideInlineErrors?: boolean
    readonly hint?: string
    readonly label: string | JSX.Element
    readonly maxDate?: Date | null | undefined
    readonly maxTime?: Date | undefined
    readonly minDate?: Date | null | undefined
    readonly minTime?: Date | undefined
    readonly minYear?: Date | null | undefined
    readonly placeholder?: string
    readonly showMonthPicker?: boolean
    readonly showYearPicker?: boolean
    readonly showTimeSelect?: boolean
    readonly timeIntervals?: number
    readonly timeCaption?: string
    readonly timeFormat?: string
    readonly isClearable?: boolean
    readonly preventOpenOnFocus?: boolean
    readonly tabIndex?: number
    readonly classNameWrapper?: string
}

const months: string[] = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
]

const CustomInput = forwardRef((props: any, ref) => {
    const { stateHasFocus, datePickerRef, ...remaining }: any = props

    function handleKeyDown(event: KeyboardEvent<HTMLButtonElement> | undefined): void {
        if (event?.key === 'Enter') {
            event?.stopPropagation()
            event?.preventDefault()
            datePickerRef.current?.setOpen(!datePickerRef.current?.isCalendarOpen(), true)
        }
    }

    return (
        <input
            type='text'
            ref={ref}
            {...remaining}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus={stateHasFocus}
            onKeyDown={handleKeyDown}
        />
    )
})

const InputDatePicker: FC<InputDatePickerProps> = (props: InputDatePickerProps) => {
    const datePickerRef = useRef<ReactDatePicker<never, undefined>>(null)

    const [stateHasFocus, setStateHasFocus] = useState(false)
    const effectiveDateFormat = props.dateFormat ?? (props.showTimeSelect ? 'MMM d, yyyy h:mm aa' : undefined)

    /**
     * Renders calendar navigation for the displayed date. Unbounded calendars offer
     * ten future years and extend that range as the user navigates forward.
     * @param header Date and navigation callbacks supplied by react-datepicker.
     * @returns The month/year controls, respecting an explicit maximum date.
     */
    function renderCustomHeader({
        date,
        changeYear,
        changeMonth,
        decreaseMonth,
        increaseMonth,
        prevMonthButtonDisabled,
        nextMonthButtonDisabled,
    }: any): JSX.Element {
        const maxYear = props.maxDate
            ? getYear(props.maxDate)
            : Math.max(getYear(new Date()), getYear(date)) + 10
        const minYear = getYear(props.minYear ? props.minYear : 1979)
        const years = range(minYear, maxYear + 1, 1)

        return (
            <div className={styles.headerWrap}>
                {
                    props.showMonthPicker !== false && (
                        <button onClick={decreaseMonth} disabled={prevMonthButtonDisabled} type='button'>
                            <IconOutline.ArrowCircleLeftIcon />
                        </button>
                    )
                }

                {
                    props.showMonthPicker !== false && (
                        <select
                            value={months[getMonth(date)]}
                            onChange={({ target: { value } }: any) => changeMonth(months.indexOf(value))}
                        >
                            {months.map(option => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    )
                }

                <select
                    value={getYear(date)}
                    onChange={({ target: { value } }: any) => changeYear(value)}
                >
                    {years.map(option => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>

                {
                    props.showMonthPicker !== false && (
                        <button onClick={increaseMonth} disabled={nextMonthButtonDisabled} type='button'>
                            <IconOutline.ArrowCircleRightIcon />
                        </button>
                    )
                }
            </div>
        )
    }

    return (
        <InputWrapper
            {...props}
            type='text'
            className={classNames(props.className, styles.container)}
        >
            <DatePicker
                ref={datePickerRef}
                customInput={<CustomInput stateHasFocus={stateHasFocus} datePickerRef={datePickerRef} />}
                renderCustomHeader={renderCustomHeader}
                selected={props.date}
                disabled={props.disabled}
                onChange={(
                    date: Date | null,
                    event: React.SyntheticEvent<any> | undefined,
                ) => {
                    event?.stopPropagation()
                    event?.preventDefault()
                    props.onChange?.(date)

                    if (!props.showTimeSelect) {
                        // re-focus on date input field after select date when closing the calendar
                        const calendarPortal = document.getElementById('react-date-portal')
                        if (calendarPortal) {
                            calendarPortal.style.display = 'none'
                        }

                        setTimeout(() => {
                            datePickerRef.current?.setFocus()
                            setTimeout(() => {
                                datePickerRef.current?.setOpen(false, true)
                                if (calendarPortal) {
                                    calendarPortal.style.display = ''
                                }
                            })
                        })
                    }
                }}
                placeholderText={props.placeholder || 'Select a date'}
                className={styles.datePickerWrapper}
                minDate={props.minDate}
                maxDate={props.maxDate}
                minTime={props.minTime}
                maxTime={props.maxTime}
                showYearPicker={props.showYearPicker}
                showTimeSelect={props.showTimeSelect}
                timeIntervals={props.timeIntervals}
                timeCaption={props.timeCaption}
                timeFormat={props.timeFormat}
                dateFormat={effectiveDateFormat}
                popperPlacement='bottom'
                portalId='react-date-portal'
                onFocus={() => setStateHasFocus(true)}
                onBlur={() => {
                    setStateHasFocus(false)
                    props.onBlur?.()
                }}
                isClearable={props.isClearable}
                preventOpenOnFocus={props.preventOpenOnFocus}
            />
        </InputWrapper>
    )
}

export default InputDatePicker
