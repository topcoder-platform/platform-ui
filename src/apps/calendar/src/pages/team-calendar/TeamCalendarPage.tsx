import { addMonths, endOfMonth, startOfMonth, subMonths } from 'date-fns'
import { FC, useCallback, useEffect, useMemo, useState } from 'react'

import { CalendarLegend, MonthNavigation, TeamCalendar } from '../../lib/components'
import { useFetchTeamLeave } from '../../lib/hooks'

import styles from './TeamCalendarPage.module.scss'

const TeamCalendarPage: FC = () => {
    const [currentDate, setCurrentDate] = useState<Date>(new Date())
    const [actionError, setActionError] = useState<string>('')
    const teamLeaveState = useFetchTeamLeave()
    const error = teamLeaveState.error
    const isLoading = teamLeaveState.isLoading
    const loadTeamLeave = teamLeaveState.loadTeamLeave
    const teamLeaveDates = teamLeaveState.teamLeaveDates

    const loadCurrentMonth = useCallback(async () => {
        setActionError('')
        try {
            await loadTeamLeave(
                startOfMonth(currentDate),
                endOfMonth(currentDate),
            )
        } catch {
            setActionError('Unable to load team leave. Please try again.')
        }
    }, [currentDate, loadTeamLeave])

    useEffect(() => {
        loadCurrentMonth()
    }, [loadCurrentMonth])

    const handlePrevMonth = useCallback(() => {
        setCurrentDate(prev => subMonths(prev, 1))
    }, [])

    const handleNextMonth = useCallback(() => {
        setCurrentDate(prev => addMonths(prev, 1))
    }, [])

    const errorMessage = useMemo(() => {
        if (actionError) return actionError
        if (error) return 'Something went wrong. Please try again.'
        return ''
    }, [actionError, error])

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h2 className={styles.title}>Team Leave Calendar</h2>
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
                <TeamCalendar
                    currentDate={currentDate}
                    isLoading={isLoading}
                    teamLeaveDates={teamLeaveDates}
                />
            </section>

            {errorMessage && (
                <div className={styles.error}>{errorMessage}</div>
            )}
        </div>
    )
}

export default TeamCalendarPage
