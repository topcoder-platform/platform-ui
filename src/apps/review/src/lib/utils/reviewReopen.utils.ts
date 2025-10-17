import { mutate } from 'swr'

/**
 * Confirmation text shown when reopening your own scorecard.
 */
export const REOPEN_MESSAGE_SELF = [
    'The scorecard will be reopened and you will be able to edit it before submitting the scorecard again.',
    'Are you sure you want to reopen the scorecard?',
].join(' ')

/**
 * Confirmation text shown when reopening someone else\'s scorecard.
 */
export const REOPEN_MESSAGE_OTHER = [
    'The scorecard will be reopened and the reviewer will be able to edit it before submitting the scorecard again.',
    'Are you sure you want to reopen the scorecard?',
].join(' ')

/**
 * Revalidate SWR caches related to challenge reviews and submissions after a reopen action.
 */
export const refreshChallengeReviewData = async (challengeId?: string): Promise<void> => {
    if (!challengeId) {
        return
    }

    await Promise.all([
        mutate((key: unknown) => (
            typeof key === 'string'
            && key.startsWith(`reviewBaseUrl/reviews/${challengeId}/`)
        )),
        mutate(`reviewBaseUrl/submissions/${challengeId}`),
    ])
}
