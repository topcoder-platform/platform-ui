import { addMonths, endOfMonth, startOfMonth, subMonths } from 'date-fns'
import { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { useProfileContext } from '~/libs/core'
import { Button } from '~/libs/ui'

import { Calendar, CalendarLegend, MonthNavigation } from '../../lib/components'
import { CalendarContext } from '../../lib/contexts/CalendarContext'
import { useFetchLeaveDates } from '../../lib/hooks'
import { LeaveStatus } from '../../lib/models'

import styles from './PersonalCalendarPage.module.scss'

const PersonalCalendarPage: FC = () => {
    const calendarContext = useContext(CalendarContext)
    const profileContext = useProfileContext()
    const [currentDate, setCurrentDate] = useState<Date>(new Date())
    const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set())
    const leaveDatesState = useFetchLeaveDates()
    const error = leaveDatesState.error
    const isLoading = leaveDatesState.isLoading
    const isUpdating = leaveDatesState.isUpdating
    const leaveDates = leaveDatesState.leaveDates
    const loadLeaveDates = leaveDatesState.loadLeaveDates
    const updateLeaveDates = leaveDatesState.updateLeaveDates
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
        loadCurrentMonth()
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

    const handleSetAsHoliday = useCallback(async () => {
        if (!selectedDates.size) return

        setActionError('')
        try {
            await updateLeaveDates(Array.from(selectedDates), LeaveStatus.HOLIDAY)
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

    const profile = profileContext.profile
    const displayName = useMemo(() => {
        const firstName = profile?.firstName?.trim()
        const lastName = profile?.lastName?.trim()
        const fullName = [firstName, lastName].filter(Boolean).join(' ')

        return (
            fullName
            || profile?.handle
            || calendarContext.loginUserInfo?.handle
            || 'Your calendar'
        )
    }, [
        calendarContext.loginUserInfo?.handle,
        profile?.firstName,
        profile?.handle,
        profile?.lastName,
    ])

    const errorMessage = actionError || (error ? 'Something went wrong. Please try again.' : '')

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <p className={styles.subtitle}>Welcome back</p>
                <h2 className={styles.title}>
                    {displayName}
                </h2>
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
                        variant='warning'
                        onClick={handleSetAsHoliday}
                        disabled={!selectedDates.size || isUpdating}
                    >
                        Set as Holiday
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
