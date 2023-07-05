/* eslint-disable react/jsx-no-bind */
import { FC } from 'react'
import { getMonth, getYear } from 'date-fns'
import { range } from 'lodash'
import DatePicker from 'react-datepicker'
import classNames from 'classnames'
import 'react-datepicker/dist/react-datepicker.css'

import { InputWrapper } from '../input-wrapper'
import { IconOutline } from '../../../../svgs'

import styles from './InputDatePicker.module.scss'

interface InputDatePickerProps {
    date: Date | undefined
    onChange: (date: Date | null) => void
    readonly className?: string
    readonly dirty?: boolean
    readonly disabled: boolean
    readonly error?: string
    readonly hideInlineErrors?: boolean
    readonly hint?: string
    readonly label: string | JSX.Element
    readonly maxDate?: Date | null | undefined;
    readonly maxTime?: Date | undefined;
    readonly minDate?: Date | null | undefined;
    readonly minTime?: Date | undefined;
    readonly placeholder?: string
    readonly tabIndex?: number
}

const years: number[] = range(1979, getYear(new Date()) + 1, 1)
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

const InputDatePicker: FC<InputDatePickerProps> = (props: InputDatePickerProps) => {
    function renderCustomHeader({
        date,
        changeYear,
        changeMonth,
        decreaseMonth,
        increaseMonth,
        prevMonthButtonDisabled,
        nextMonthButtonDisabled,
    }: any): JSX.Element {
        return (
            <div className={styles.headerWrap}>
                <button onClick={decreaseMonth} disabled={prevMonthButtonDisabled} type='button'>
                    <IconOutline.ArrowCircleLeftIcon />
                </button>

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

                <button onClick={increaseMonth} disabled={nextMonthButtonDisabled} type='button'>
                    <IconOutline.ArrowCircleRightIcon />
                </button>
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
                renderCustomHeader={renderCustomHeader}
                selected={props.date}
                onChange={props.onChange}
                placeholderText={props.placeholder || 'Select a date'}
                className={styles.datePickerWrapper}
                minDate={props.minDate}
                maxDate={props.maxDate}
                minTime={props.minTime}
                maxTime={props.maxTime}
            />
        </InputWrapper>
    )
}

export default InputDatePicker
