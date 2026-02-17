import { format, isWeekend } from 'date-fns'
import { FC, useCallback, useMemo, useState } from 'react'
import classNames from 'classnames'

import { LoadingSpinner } from '~/libs/ui'
import { useCheckIsMobile } from '~/libs/shared'

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

    if (fullName) {
        return fullName
    }

    if (user.status === LeaveStatus.WIPRO_HOLIDAY || user.userId === 'wipro-holiday') {
        return user.handle || user.userId
    }

    return user.userId
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
    const [openDateKey, setOpenDateKey] = useState<string | undefined>(undefined)

    const isMobile: boolean = useCheckIsMobile()

    const closePopover = useCallback(() => {
        setOpenDateKey(undefined)
    }, [])

    const handleCellClick = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            if (!isMobile) return

            const dateKey = e.currentTarget.dataset.dateKey
            if (!dateKey) return

            setOpenDateKey(prev => (prev === dateKey ? undefined : dateKey))
        },
        [isMobile],
    )

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

                    // Mobile popover open/close
                    const isOpen = openDateKey === dateKey
                    const leaveCount = sortedUsers.length

                    return (
                        <div
                            key={dateKey}
                            className={classNames(styles.cell, weekendClass, {
                                [styles.loading]: isLoading,
                                [styles.hasLeave]: leaveCount > 0,
                            })}
                        >
                            {/* Whole cell tappable on mobile */}
                            <button
                                type='button'
                                className={styles.cellButton}
                                disabled={isLoading}
                                onClick={handleCellClick}
                                data-date-key={dateKey}
                                aria-haspopup='dialog'
                                aria-expanded={isMobile ? isOpen : undefined}
                                aria-label={`Open leave list for ${dateKey}`}
                            >
                                <span className={styles.dateNumber}>{date.getDate()}</span>

                                {/* MOBILE: only show count badge */}
                                {isMobile && leaveCount > 0 && (
                                    <span className={styles.countBadge}>{leaveCount}</span>
                                )}

                                {/* DESKTOP: show list in the cell (your existing UI) */}
                                {!isMobile && (
                                    <div className={styles.userList}>
                                        {displayedUsers.length > 0
                                        && displayedUsers.map((user, userIndex) => {
                                            const isHolidayStatus
                                        = user.status === LeaveStatus.WIPRO_HOLIDAY
                                        || user.status === LeaveStatus.HOLIDAY

                                            return (
                                                <div
                                                    key={`${dateKey}-${user.userId}-${userIndex.toString()}`}
                                                    className={classNames(
                                                        styles.userItem,
                                                        isHolidayStatus
                                                            ? styles.userHoliday
                                                            : styles.userLeave,
                                                    )}
                                                >
                                                    {getUserDisplayName(user)}
                                                </div>
                                            )
                                        })}
                                        {overflowCount > 0 && (
                                            <div className={styles.overflowIndicator}>
                                                {`+${overflowCount} more`}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </button>
                        </div>
                    )
                })}
            </div>

            {isMobile && openDateKey && (() => {
                const selectedDate = paddedDates.find(d => d && getDateKey(d) === openDateKey)
                if (!selectedDate) return undefined

                const selectedEntry = teamLeaveDates.find(item => item.date === openDateKey)
                const selectedUsers = [...(selectedEntry?.usersOnLeave ?? [])].sort(compareUsersByName)

                return (
                    <div className={styles.modalRoot}>
                        <div className={styles.backdrop} onClick={closePopover} />

                        <div className={styles.popover} role='dialog' aria-label='Users on leave'>
                            <div className={styles.popoverHeader}>
                                <div className={styles.popoverTitle}>
                                    {format(selectedDate, 'EEE, dd MMM yyyy')}
                                </div>

                                <button
                                    type='button'
                                    className={styles.closeBtn}
                                    onClick={closePopover}
                                    aria-label='Close'
                                >
                                    ✕
                                </button>
                            </div>

                            <div className={styles.popoverBody}>
                                {selectedUsers.length === 0 ? (
                                    <div className={styles.emptyState}>No leave</div>
                                ) : (
                                    selectedUsers.map((user, idx) => {
                                        const isHolidayStatus
                                    = user.status === LeaveStatus.WIPRO_HOLIDAY
                                    || user.status === LeaveStatus.HOLIDAY

                                        return (
                                            <div
                                                key={`${openDateKey}-${user.userId}-${idx.toString()}`}
                                                className={classNames(
                                                    styles.userItem,
                                                    isHolidayStatus ? styles.userHoliday : styles.userLeave,
                                                )}
                                            >
                                                {getUserDisplayName(user)}
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                )
            })()}

            {isLoading && (
                <div className={styles.loadingOverlay}>
                    <LoadingSpinner />
                </div>
            )}
        </div>
    )

}

export default TeamCalendar
