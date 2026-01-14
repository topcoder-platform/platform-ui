import { TokenModel } from '~/libs/core'

export enum LeaveStatus {
    AVAILABLE = 'AVAILABLE',
    LEAVE = 'LEAVE',
    HOLIDAY = 'HOLIDAY',
    WIPRO_HOLIDAY = 'WIPRO_HOLIDAY',
    WEEKEND = 'WEEKEND',
}

export type LeaveUpdateStatus = LeaveStatus.AVAILABLE | LeaveStatus.LEAVE | LeaveStatus.HOLIDAY

export interface LeaveDate {
    date: string
    status: LeaveStatus
}

export interface TeamLeaveDate {
    date: string
    usersOnLeave: Array<{
        userId: string
        handle?: string
        firstName?: string
        lastName?: string
        status: LeaveStatus.LEAVE | LeaveStatus.HOLIDAY | LeaveStatus.WIPRO_HOLIDAY
    }>
}

export interface CalendarContextModel {
    loginUserInfo?: TokenModel
}
