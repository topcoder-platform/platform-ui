/**
 * Util for time
 */
import moment from 'moment'
import 'moment-duration-format'

import { THRESHOLD_SHORT_TIME } from '../../config/index.config'

/**
 * Format duration
 * @param startDate start date
 * @param endDate end date
 * @returns duration string
 */
export function formatDurationDate(
    startDate: Date,
    endDate: Date,
): {
    durationString: string
    durationColor: string
    durationStatus: string
} {
    const timeLeftDuration = moment.duration(
        moment(startDate)
            .diff(moment(endDate)),
    )
    const durationMilisecond = timeLeftDuration.asMilliseconds()
    let durationColor = ''
    let durationStatus = 'normal'
    if (durationMilisecond < 0) {
        durationColor = 'var(--Red)'
        durationStatus = 'error'
    } else if (durationMilisecond < THRESHOLD_SHORT_TIME) {
        durationColor = 'var(--Yellow)'
        durationStatus = 'warning'
    }

    const absoluteDuration = moment.duration(
        Math.abs(durationMilisecond),
        'milliseconds',
    )
    const formattedDuration = (absoluteDuration as any)
        .format('d[d] h[h] m[m]', { trim: 'both' })
        .trim()
        || '0m'
    const durationString = durationMilisecond < 0
        ? `Late by ${formattedDuration}`
        : formattedDuration

    return {
        durationColor,
        durationStatus,
        durationString,
    }
}
