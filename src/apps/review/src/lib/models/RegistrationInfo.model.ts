import moment from 'moment'

import { getRatingColor } from '~/libs/core'

import { TABLE_DATE_FORMAT } from '../../config/index.config'

/**
 * Challenge registration info
 */
export interface RegistrationInfo {
    id: string
    handle: string
    handleColor: string
    rating?: number
    ratingColor?: string // this field is calculated at frontend
    registrationDate: string | Date
    registrationDateString?: string // this field is calculated at frontend
}

/**
 * Update challenge registration info to show in ui
 * @param data data from backend response
 * @returns updated data
 */
export function adjustRegistrationInfo(
    data: RegistrationInfo | undefined,
): RegistrationInfo | undefined {
    if (!data) {
        return data
    }

    const registrationDate = data.registrationDate
        ? new Date(data.registrationDate)
        : data.registrationDate

    return {
        ...data,
        ratingColor: data.rating ? getRatingColor(data.rating ?? 0) : '',
        registrationDate,
        registrationDateString: registrationDate
            ? moment(registrationDate)
                .local()
                .format(TABLE_DATE_FORMAT)
            : registrationDate,
    }
}
