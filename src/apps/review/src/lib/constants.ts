export const SUBMISSION_TYPE_CONTEST = 'CONTEST_SUBMISSION'
export const SUBMISSION_TYPE_CHECKPOINT = 'CHECKPOINT_SUBMISSION'
export const TABLE_DATE_FORMAT = 'MMM DD, HH:mm A'
export const SUBMISSION_DOWNLOAD_RESTRICTION_MESSAGE
  = 'This challenge is a private challenge. You do not have permission to download submissions.'

const normalizeSubmissionType = (value?: string | null): string => (
    (value ?? '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z]/g, '')
)

const NORMALIZED_CONTEST_SUBMISSION_TYPE = normalizeSubmissionType(SUBMISSION_TYPE_CONTEST)
const NORMALIZED_CHECKPOINT_SUBMISSION_TYPE = normalizeSubmissionType(SUBMISSION_TYPE_CHECKPOINT)

interface SubmissionTypeMatchOptions {
    defaultToContest?: boolean
}

export const isContestSubmissionType = (
    value?: string | null,
    options?: SubmissionTypeMatchOptions,
): boolean => {
    const normalizedType = normalizeSubmissionType(value)
    if (!normalizedType) {
        return Boolean(options?.defaultToContest)
    }

    return normalizedType === NORMALIZED_CONTEST_SUBMISSION_TYPE
}

export const isCheckpointSubmissionType = (
    value?: string | null,
): boolean => normalizeSubmissionType(value) === NORMALIZED_CHECKPOINT_SUBMISSION_TYPE
