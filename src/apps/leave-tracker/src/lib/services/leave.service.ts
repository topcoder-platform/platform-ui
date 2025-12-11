import qs from 'qs'

import { EnvironmentConfig } from '~/config'
import { xhrGetAsync, xhrPostAsync } from '~/libs/core'

import type { LeaveDate, LeaveUpdateStatus, TeamLeaveDate } from '../models'

const serializeQuery = (params: Record<string, unknown>): string =>
    qs.stringify(params, { addQueryPrefix: true, skipNulls: true })

export const fetchUserLeaveDates = async (
    startDate?: string,
    endDate?: string,
): Promise<LeaveDate[]> => {
    const queryString = serializeQuery({ startDate, endDate })

    return xhrGetAsync(`${EnvironmentConfig.API.V6}/leave/dates${queryString}`)
}

export const setLeaveDates = async (
    dates: string[],
    status: LeaveUpdateStatus,
): Promise<void> => xhrPostAsync(`${EnvironmentConfig.API.V6}/leave/dates`, { dates, status })

export const fetchTeamLeave = async (
    startDate?: string,
    endDate?: string,
): Promise<TeamLeaveDate[]> => {
    const queryString = serializeQuery({ startDate, endDate })

    return xhrGetAsync(`${EnvironmentConfig.API.V6}/leave/team${queryString}`)
}
