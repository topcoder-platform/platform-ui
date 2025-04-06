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
} {
    const timeLeftDuration = moment.duration(
        moment(startDate)
            .diff(moment(endDate)),
    )
    const durationMilisecond = timeLeftDuration.asMilliseconds()
    let durationColor = 'var(--Green)'
    if (durationMilisecond < 0) {
        durationColor = 'var(--Red)'
    } else if (durationMilisecond < THRESHOLD_SHORT_TIME) {
        durationColor = 'var(--Yellow)'
    }

    return {
        durationColor,
        durationString: (timeLeftDuration as any).format('d[d] h[h] m[m]', {
            trim: 'both',
        }),
    }
}
