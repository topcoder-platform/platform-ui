/**
 * DateInput
 *
 * Date Input control.
 */
import { Portal } from 'react-overlays'
import { createRef, FC, useState } from 'react'
import DatePicker from 'react-datepicker'
import cn from 'classnames'
import moment from 'moment'
import 'react-datepicker/dist/react-datepicker.css'

import { IconOutline } from '~/libs/ui'

import { ReactComponent as CalendarIcon } from '../../assets/images/calendar.svg'

import styles from './styles.module.scss'

interface CalendarContainerProps {
    children?: any
}
const CalendarContainer: FC<CalendarContainerProps> = (props: CalendarContainerProps) => {
    const el: any = document.getElementById('calendar-portal')

    return <Portal container={el}>{props.children}</Portal>
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
                onClick={function openCalendar() {
                    calendarRef.current.setOpen(true)
                }}
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
                onCalendarClose={function closeCalendar() {
                    setOpen(false)
                }}
                onFocus={props.onFocus}
                showYearDropdown
                dropdownMode='select'
                onCalendarOpen={function openCalendar() {
                    setOpen(true)
                }}
                maxDate={
                    props.allowFutureDate ? undefined : moment()
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
                onClick={function openCalendar() {
                    calendarRef.current.setOpen(true)
                }}
            >
                <IconOutline.ChevronDownIcon />
            </div>
        </div>
    )
}

export default DateInput
