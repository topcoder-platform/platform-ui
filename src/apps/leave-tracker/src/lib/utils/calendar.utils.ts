import { eachDayOfInterval, endOfMonth, format, startOfMonth } from 'date-fns'

import { LeaveDate, LeaveStatus } from '../models'

const statusColorMap: Record<LeaveStatus, string> = {
    [LeaveStatus.LEAVE]: 'status-leave',
    [LeaveStatus.WIPRO_HOLIDAY]: 'status-holiday',
    [LeaveStatus.WEEKEND]: 'status-weekend',
    [LeaveStatus.AVAILABLE]: 'status-available',
}

const statusLabelMap: Record<LeaveStatus, string> = {
    [LeaveStatus.LEAVE]: 'Leave',
    [LeaveStatus.WIPRO_HOLIDAY]: 'Wipro Holiday',
    [LeaveStatus.WEEKEND]: 'Weekend',
    [LeaveStatus.AVAILABLE]: 'Available',
}

export const legendStatusOrder: LeaveStatus[] = [
    LeaveStatus.AVAILABLE,
    LeaveStatus.LEAVE,
    LeaveStatus.WIPRO_HOLIDAY,
    LeaveStatus.WEEKEND,
]

export const getMonthDates = (year: number, month: number): Date[] => {
    const monthDate = new Date(year, month, 1)

    return eachDayOfInterval({
        end: endOfMonth(monthDate),
        start: startOfMonth(monthDate),
    })
}

export const formatMonthYear = (date: Date): string => format(date, 'LLLL yyyy')

export const getDateKey = (date: Date): string => format(date, 'yyyy-MM-dd')

export const getStatusForDate = (date: Date, leaveDates: LeaveDate[]): LeaveStatus => {
    const dateKey = getDateKey(date)
    const match = leaveDates.find(item => item.date === dateKey)

    return match?.status ?? LeaveStatus.AVAILABLE
}

export const getStatusColor = (status: LeaveStatus): string => {
    return statusColorMap[status] ?? statusColorMap[LeaveStatus.AVAILABLE]
}

export const getStatusLabel = (status: LeaveStatus): string => statusLabelMap[status]

export const legendItems = legendStatusOrder.map(status => ({
    label: getStatusLabel(status),
    status,
    statusClass: getStatusColor(status),
}))
