import classNames from 'classnames'
import { isWeekend } from 'date-fns'
import { FC, useMemo } from 'react'

import { LoadingSpinner } from '~/libs/ui'

import { LeaveStatus, TeamLeaveDate } from '../../models'
import { getDateKey, getMonthDates } from '../../utils'

import styles from './TeamCalendar.module.scss'

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface TeamCalendarProps {
    currentDate: Date
    teamLeaveDates: TeamLeaveDate[]
    isLoading: boolean
}

export const TeamCalendar: FC<TeamCalendarProps> = ({
    currentDate,
    isLoading,
    teamLeaveDates,
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
        <div className={styles.teamCalendar}>
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
                    const leaveEntry = teamLeaveDates.find(item => item.date === dateKey)
                    const users = leaveEntry?.usersOnLeave ?? []
                    const displayedUsers = users.slice(0, 10)
                    const overflowCount = users.length - displayedUsers.length
                    const weekendClass = isWeekend(date) ? styles.weekend : undefined

                    return (
                        <div
                            key={dateKey}
                            className={classNames(styles.cell, weekendClass, {
                                [styles.loading]: isLoading,
                            })}
                        >
                            <span className={styles.dateNumber}>{date.getDate()}</span>
                            <div className={styles.userList}>
                                {displayedUsers.length ? (
                                    displayedUsers.map((user, userIndex) => (
                                        <div
                                            key={`${dateKey}-${user.userId}-${userIndex.toString()}`}
                                            className={classNames(
                                                styles.userItem,
                                                user.status === LeaveStatus.WIPRO_HOLIDAY
                                                    ? styles.userHoliday
                                                    : styles.userLeave,
                                            )}
                                        >
                                            {user.handle ?? user.userId}
                                        </div>
                                    ))
                                ) : (
                                    <div className={styles.emptyState}>No leave</div>
                                )}
                                {overflowCount > 0 && (
                                    <div className={styles.overflowIndicator}>
                                        +{overflowCount} more
                                    </div>
                                )}
                            </div>
                        </div>
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

export default TeamCalendar
