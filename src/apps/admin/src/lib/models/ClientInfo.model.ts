import moment from 'moment'

import { TABLE_DATE_FORMAT } from '../../config/index.config'

/**
 * Model for client info
 */
export interface ClientInfo {
    id: number
    name: string
    status: string
    startDate: Date
    startDateString: string
    endDate: Date
    endDateString: string
    codeName: string
}

/**
 * Update client info to show in ui
 * @param data data from backend response
 * @returns updated data
 */
export function adjustClientInfoResponse(data: ClientInfo): ClientInfo {
    const startDate = data.startDate ? new Date(data.startDate) : data.startDate
    const endDate = data.endDate ? new Date(data.endDate) : data.endDate
    return {
        ...data,
        endDate,
        endDateString: data.endDate
            ? moment(data.endDate)
                .local()
                .format(TABLE_DATE_FORMAT)
            : data.endDate,
        startDate,
        startDateString: data.startDate
            ? moment(data.startDate)
                .local()
                .format(TABLE_DATE_FORMAT)
            : data.startDate,
    }
}
