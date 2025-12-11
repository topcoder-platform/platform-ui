import { addMonths, endOfMonth, startOfMonth, subMonths } from 'date-fns'
import { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { Button } from '~/libs/ui'

import { Calendar, CalendarLegend, MonthNavigation } from '../../lib/components'
import { LeaveStatus } from '../../lib/models'
import { LeaveTrackerContext } from '../../lib/contexts/LeaveTrackerContext'
import { useFetchLeaveDates } from '../../lib/hooks'
import styles from './PersonalCalendarPage.module.scss'

const PersonalCalendarPage: FC = () => {
    const { loginUserInfo } = useContext(LeaveTrackerContext)
    const [currentDate, setCurrentDate] = useState<Date>(new Date())
    const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set())
    const {
        error,
        isLoading,
        isUpdating,
        leaveDates,
        loadLeaveDates,
        updateLeaveDates,
    } = useFetchLeaveDates()
    const [actionError, setActionError] = useState<string>('')

    const loadCurrentMonth = useCallback(async () => {
        setActionError('')
        try {
            await loadLeaveDates(
                startOfMonth(currentDate),
                endOfMonth(currentDate),
            )
        } catch {
            setActionError('Unable to load leave dates. Please try again.')
        }
    }, [currentDate, loadLeaveDates])

    useEffect(() => {
        void loadCurrentMonth()
    }, [loadCurrentMonth])

    const handlePrevMonth = useCallback(() => {
        setSelectedDates(new Set())
        setCurrentDate(prev => subMonths(prev, 1))
    }, [])

    const handleNextMonth = useCallback(() => {
        setSelectedDates(new Set())
        setCurrentDate(prev => addMonths(prev, 1))
    }, [])

    const handleDateClick = useCallback((dateKey: string) => {
        setSelectedDates(prev => {
            const next = new Set(prev)
            if (next.has(dateKey)) {
                next.delete(dateKey)
            } else {
                next.add(dateKey)
            }
            return next
        })
    }, [])

    const handleSetAsLeave = useCallback(async () => {
        if (!selectedDates.size) return

        setActionError('')
        try {
            await updateLeaveDates(Array.from(selectedDates), LeaveStatus.LEAVE)
            setSelectedDates(new Set())
            await loadCurrentMonth()
        } catch {
            setActionError('Unable to update leave dates. Please try again.')
        }
    }, [loadCurrentMonth, selectedDates, updateLeaveDates])

    const handleSetAsAvailable = useCallback(async () => {
        if (!selectedDates.size) return

        setActionError('')
        try {
            await updateLeaveDates(Array.from(selectedDates), LeaveStatus.AVAILABLE)
            setSelectedDates(new Set())
            await loadCurrentMonth()
        } catch {
            setActionError('Unable to update leave dates. Please try again.')
        }
    }, [loadCurrentMonth, selectedDates, updateLeaveDates])

    const selectionLabel = useMemo(() => {
        const count = selectedDates.size
        if (!count) return 'No dates selected'
        return `${count} date${count > 1 ? 's' : ''} selected`
    }, [selectedDates])

    const errorMessage = actionError || (error ? 'Something went wrong. Please try again.' : '')

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <p className={styles.subtitle}>Welcome back</p>
                <h2 className={styles.title}>{loginUserInfo?.handle ?? 'Your calendar'}</h2>
            </header>

            <section className={styles.navigation}>
                <MonthNavigation
                    currentDate={currentDate}
                    onNextMonth={handleNextMonth}
                    onPrevMonth={handlePrevMonth}
                />
                <CalendarLegend />
            </section>

            <section className={styles.calendarSection}>
                <Calendar
                    currentDate={currentDate}
                    isLoading={isLoading}
                    leaveDates={leaveDates}
                    onDateClick={handleDateClick}
                    selectedDates={selectedDates}
                />
            </section>

            <section className={styles.actions}>
                <div className={styles.actionButtons}>
                    <Button
                        primary
                        onClick={handleSetAsLeave}
                        disabled={!selectedDates.size || isUpdating}
                    >
                        Set as Leave
                    </Button>
                    <Button
                        secondary
                        onClick={handleSetAsAvailable}
                        disabled={!selectedDates.size || isUpdating}
                    >
                        Set as Available
                    </Button>
                </div>
                <div className={styles.selectionInfo}>{selectionLabel}</div>
            </section>

            {errorMessage && (
                <div className={styles.error}>{errorMessage}</div>
            )}
        </div>
    )
}

export default PersonalCalendarPage
