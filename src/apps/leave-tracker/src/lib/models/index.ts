import { TokenModel } from '~/libs/core'

export enum LeaveStatus {
    AVAILABLE = 'AVAILABLE',
    LEAVE = 'LEAVE',
    WEEKEND = 'WEEKEND',
    WIPRO_HOLIDAY = 'WIPRO_HOLIDAY',
}

export type LeaveUpdateStatus = LeaveStatus.AVAILABLE | LeaveStatus.LEAVE

export interface LeaveDate {
    date: string
    status: LeaveStatus
}

export interface TeamLeaveDate {
    date: string
    usersOnLeave: Array<{
        userId: string
        handle?: string
        status: LeaveStatus.LEAVE | LeaveStatus.WIPRO_HOLIDAY
    }>
}

export interface LeaveTrackerContextModel {
    loginUserInfo?: TokenModel
}
