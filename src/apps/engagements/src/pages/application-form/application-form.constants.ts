import type { YesNoAnswer } from './application-form.types'

export const REFERRED_BY_OPTION = 'Referred by'

export const REFERRAL_SOURCE_OPTIONS: string[] = [
    'Topcoder Newsletter',
    'LinkedIn',
    'Naukri',
    'Other Social Media Promotion',
    REFERRED_BY_OPTION,
]

export const AVAILABLE_WITHIN_WEEK_QUESTION = 'Are you available to start within a week from now?'
export const AVAILABLE_FULL_TIME_QUESTION = 'Are you available to work full-time around 8 hours per day?'

const formatYesNo = (value: YesNoAnswer): string => (value === 'yes' ? 'Yes' : 'No')

/**
 * Builds the availability text stored on the application from the two availability answers.
 * Each answer is kept on its own line so it reads well wherever the application is displayed.
 *
 * @param availableWithinWeek answer to "available to start within a week".
 * @param availableFullTime answer to "available to work full-time".
 * @returns the availability text, or `undefined` when neither question was answered.
 */
export const buildAvailabilityText = (
    availableWithinWeek?: YesNoAnswer,
    availableFullTime?: YesNoAnswer,
): string | undefined => {
    const lines: string[] = []
    if (availableWithinWeek) {
        lines.push(`Available to start within a week: ${formatYesNo(availableWithinWeek)}`)
    }

    if (availableFullTime) {
        lines.push(`Available to work full-time (~8 hours/day): ${formatYesNo(availableFullTime)}`)
    }

    return lines.length ? lines.join('\n') : undefined
}

/**
 * Builds the referral source stored on the application, appending the referrer handle for referrals.
 *
 * @param referralSource the selected referral option.
 * @param referrerHandle handle of the referring member, used only for the "Referred by" option.
 * @returns the referral source text, or `undefined` when nothing was selected.
 */
export const buildReferralSourceText = (
    referralSource?: string,
    referrerHandle?: string,
): string | undefined => {
    if (!referralSource) {
        return undefined
    }

    if (referralSource === REFERRED_BY_OPTION) {
        const handle = referrerHandle?.trim()
        return handle ? `${REFERRED_BY_OPTION} ${handle}` : REFERRED_BY_OPTION
    }

    return referralSource
}
