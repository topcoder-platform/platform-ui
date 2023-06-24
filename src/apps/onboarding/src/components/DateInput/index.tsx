/* eslint-disable ordered-imports/ordered-imports */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable unicorn/no-null */
/* eslint-disable max-len */
/* eslint-disable react/destructuring-assignment */
/**
 * DateInput
 *
 * Date Input control.
 */
import React, { FC, createRef, useState } from 'react'
import DatePicker from 'react-datepicker'
import { Portal } from 'react-overlays'
import cn from 'classnames'
import moment from 'moment'

import 'react-datepicker/dist/react-datepicker.css'

import styles from './styles.module.scss'

const CalendarIcon: any = () => (
    <svg
        width='16'
        height='16'
        viewBox='0 0 16 16'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
    >
        <path
            d='M13.1849 2.66659H12.4441V1.33325H10.9626V2.66659H5.03671V1.33325H3.55523V2.66659H2.81449C1.99227 2.66659 1.34042 3.26659 1.34042 3.99992L1.33301 13.3333C1.33301 14.0666 1.99227 14.6666 2.81449 14.6666H13.1849C13.9997 14.6666 14.6663 14.0666 14.6663 13.3333V3.99992C14.6663 3.26659 13.9997 2.66659 13.1849 2.66659ZM13.1849 13.3333H2.81449V5.99992H13.1849V13.3333ZM4.29597 7.33325H7.99967V10.6666H4.29597V7.33325Z'
            fill='#7F7F7F'
        />
    </svg>
)
const ArrowIcon: any = () => (
    <svg
        height='20'
        width='20'
        viewBox='0 0 20 20'
        aria-hidden='true'
        focusable='false'
    >
        <path
            d='M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z'
        />
    </svg>
)

interface CalendarContainerProps {
    children?: any
}
const CalendarContainer: FC<CalendarContainerProps> = ({ children }: CalendarContainerProps) => {
    const el: any = document.getElementById('calendar-portal')

    return <Portal container={el}>{children}</Portal>
}

interface DateInputProps {
    style2?: boolean
    className?: string
    placeholder?: string
    value?: Date
    onChange?: (date: Date | null) => void
    onBlur?: () => void
    onFocus?: () => void
    allowFutureDate?: boolean
    disabled?: boolean
}

const DateInput: FC<DateInputProps> = (props: DateInputProps) => {
    const [open, setOpen] = useState(false)
    const calendarRef: any = createRef<any>()
    return (
        <div
            className={cn(
                styles['datepicker-wrapper'],
                props.className,
                props.style2 ? styles.style2 : '',
            )}
        >
            <div
                onClick={() => calendarRef.current.setOpen(true)}
                className={cn(styles.icon, styles['icon-calendar'])}
            >
                <CalendarIcon />
            </div>
            <DatePicker
                ref={calendarRef}
                dateFormat='MM/dd/yyyy'
                placeholderText={props.placeholder}
                selected={props.value}
                onChange={props.onChange as any}
                onBlur={props.onBlur}
                onCalendarClose={() => {
                    setOpen(false)
                }}
                onFocus={props.onFocus}
                showYearDropdown
                onCalendarOpen={() => setOpen(true)}
                maxDate={
                    props.allowFutureDate ? null : moment()
                        .subtract(1, 'days')
                        .toDate()
                }
                disabled={props.disabled}
                popperContainer={CalendarContainer}
            />
            <div
                className={cn(
                    styles.icon,
                    styles['icon-arrow'],
                    open ? styles['icon-arrow-open'] : '',
                )}
                onClick={() => calendarRef.current.setOpen(true)}
            >
                <ArrowIcon />
            </div>
        </div>
    )
}

export default DateInput
