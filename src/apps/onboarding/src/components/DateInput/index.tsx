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

import { ReactComponent as CalendarIcon } from '../../assets/images/calendar.svg'
import { ReactComponent as ArrowIcon } from '../../assets/images/cheveron-down.svg'
import styles from './styles.module.scss'

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
