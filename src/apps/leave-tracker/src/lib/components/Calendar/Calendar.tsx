import classNames from 'classnames'
import { FC, useMemo } from 'react'

import { LoadingSpinner } from '~/libs/ui'

import { LeaveDate } from '../../models'
import {
    getDateKey,
    getMonthDates,
    getStatusColor,
    getStatusForDate,
} from '../../utils'

import styles from './Calendar.module.scss'

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface CalendarProps {
    currentDate: Date
    leaveDates: LeaveDate[]
    selectedDates: Set<string>
    onDateClick: (dateKey: string) => void
    isLoading: boolean
}

export const Calendar: FC<CalendarProps> = ({
    currentDate,
    isLoading,
    leaveDates,
    onDateClick,
    selectedDates,
}) => {
    const monthDates = useMemo(
        () => getMonthDates(currentDate.getFullYear(), currentDate.getMonth()),
        [currentDate],
    )

    const paddedDates = useMemo(() => {
        if (!monthDates.length) {
            return []
        }

        const padding = monthDates[0].getDay()
        const cells: Array<Date | null> = []

        for (let i = 0; i < padding; i += 1) {
            cells.push(null)
        }

        cells.push(...monthDates)

        while (cells.length % 7 !== 0) {
            cells.push(null)
        }

        return cells
    }, [monthDates])

    return (
        <div className={styles.calendar}>
            <div className={styles.dayNames}>
                {dayNames.map(day => (
                    <div key={day} className={styles.dayName}>
                        {day}
                    </div>
                ))}
            </div>

            <div className={styles.grid}>
                {paddedDates.map((date, index) => {
                    if (!date) {
                        return <div key={`empty-${index.toString()}`} className={classNames(styles.cell, styles.empty)} />
                    }

                    const dateKey = getDateKey(date)
                    const status = getStatusForDate(date, leaveDates)
                    const isSelected = selectedDates.has(dateKey)
                    const statusClass = styles[getStatusColor(status)]

                    return (
                        <button
                            key={dateKey}
                            type='button'
                            className={classNames(
                                styles.cell,
                                statusClass,
                                {
                                    [styles.selected]: isSelected,
                                    [styles.loading]: isLoading,
                                },
                            )}
                            onClick={() => onDateClick(dateKey)}
                            disabled={isLoading}
                        >
                            <span className={styles.dateNumber}>{date.getDate()}</span>
                        </button>
                    )
                })}
            </div>

            {isLoading && (
                <div className={styles.loadingOverlay}>
                    <LoadingSpinner />
                </div>
            )}
        </div>
    )
}

export default Calendar
