import { isWeekend } from 'date-fns'
import { FC, useMemo } from 'react'
import classNames from 'classnames'

import { LoadingSpinner } from '~/libs/ui'

import { LeaveStatus, TeamLeaveDate } from '../../models'
import { getDateKey, getMonthDates } from '../../utils'

import styles from './TeamCalendar.module.scss'

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
type TeamLeaveUser = TeamLeaveDate['usersOnLeave'][number]

const getUserDisplayName = (user: TeamLeaveUser): string => {
    const firstName = user.firstName?.trim()
    const lastName = user.lastName?.trim()
    const fullName = [firstName, lastName]
        .filter(Boolean)
        .join(' ')

    return fullName || user.handle || user.userId
}

const compareUsersByName = (userA: TeamLeaveUser, userB: TeamLeaveUser): number => {
    const firstNameA = userA.firstName?.trim() || getUserDisplayName(userA)
    const firstNameB = userB.firstName?.trim() || getUserDisplayName(userB)
    const firstNameCompare = firstNameA.localeCompare(firstNameB, undefined, { sensitivity: 'base' })

    if (firstNameCompare !== 0) {
        return firstNameCompare
    }

    const lastNameA = userA.lastName?.trim() ?? ''
    const lastNameB = userB.lastName?.trim() ?? ''
    const lastNameCompare = lastNameA.localeCompare(lastNameB, undefined, { sensitivity: 'base' })

    if (lastNameCompare !== 0) {
        return lastNameCompare
    }

    return (userA.userId ?? '').localeCompare(userB.userId ?? '', undefined, { sensitivity: 'base' })
}

interface TeamCalendarProps {
    currentDate: Date
    teamLeaveDates: TeamLeaveDate[]
    isLoading: boolean
}

export const TeamCalendar: FC<TeamCalendarProps> = (props: TeamCalendarProps) => {
    const currentDate = props.currentDate
    const isLoading = props.isLoading
    const teamLeaveDates = props.teamLeaveDates

    const monthDates = useMemo(
        () => getMonthDates(currentDate.getFullYear(), currentDate.getMonth()),
        [currentDate],
    )

    const paddedDates = useMemo(() => {
        if (!monthDates.length) {
            return []
        }

        const padding = monthDates[0].getDay()
        const cells: Array<Date | undefined> = []

        for (let i = 0; i < padding; i += 1) {
            cells.push(undefined)
        }

        cells.push(...monthDates)

        while (cells.length % 7 !== 0) {
            cells.push(undefined)
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
                        return (
                            <div
                                key={`empty-${index.toString()}`}
                                className={classNames(styles.cell, styles.empty)}
                            />
                        )
                    }

                    const dateKey = getDateKey(date)
                    const leaveEntry = teamLeaveDates.find(item => item.date === dateKey)
                    const users = leaveEntry?.usersOnLeave ?? []
                    const sortedUsers = [...users].sort(compareUsersByName)
                    const displayedUsers = sortedUsers.slice(0, 10)
                    const overflowCount = sortedUsers.length - displayedUsers.length
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
                                {displayedUsers.length > 0
                                    && displayedUsers.map((user, userIndex) => (
                                        <div
                                            key={`${dateKey}-${user.userId}-${userIndex.toString()}`}
                                            className={classNames(
                                                styles.userItem,
                                                user.status === LeaveStatus.WIPRO_HOLIDAY
                                                    ? styles.userHoliday
                                                    : styles.userLeave,
                                            )}
                                        >
                                            {getUserDisplayName(user)}
                                        </div>
                                    ))}
                                {overflowCount > 0 && (
                                    <div className={styles.overflowIndicator}>
                                        {`+${overflowCount} more`}
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
