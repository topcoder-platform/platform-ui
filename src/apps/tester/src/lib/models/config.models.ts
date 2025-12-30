import type {
    AppConfig,
    DesignConfig,
    First2FinishConfig,
    FullChallengeConfig,
    PrizeTuple,
} from '../types'

const isRecord = (value: unknown): value is Record<string, unknown> => (
    typeof value === 'object' && value !== null && !Array.isArray(value)
)

const isString = (value: unknown): value is string => (
    typeof value === 'string'
)

const isNumber = (value: unknown): value is number => (
    typeof value === 'number' && !Number.isNaN(value)
)

const isStringArray = (value: unknown): value is string[] => (
    Array.isArray(value) && value.every(isString)
)

const isPrizeTuple = (value: unknown): value is PrizeTuple => (
    Array.isArray(value)
    && value.length === 3
    && value.every(isNumber)
)

const isOptionalString = (value: unknown): boolean => (
    value === undefined || isString(value)
)

export const normalizeStringArray = (value: unknown, fallback: string[]): string[] => (
    isStringArray(value) ? value : fallback
)

export const normalizeNumber = (value: unknown, fallback: number): number => (
    isNumber(value) ? value : fallback
)

export const normalizeString = (value: unknown, fallback: string): string => (
    isString(value) ? value : fallback
)

export const normalizePrizeTuple = (value: unknown, fallback: PrizeTuple): PrizeTuple => (
    isPrizeTuple(value) ? value : fallback
)

export const validateFullChallengeConfig = (config: unknown): config is FullChallengeConfig => {
    if (!isRecord(config)) {
        return false
    }

    return isString(config.challengeNamePrefix)
        && isNumber(config.projectId)
        && isString(config.challengeTypeId)
        && isString(config.challengeTrackId)
        && isString(config.timelineTemplateId)
        && isString(config.copilotHandle)
        && isOptionalString(config.screener)
        && isStringArray(config.reviewers)
        && isStringArray(config.submitters)
        && isNumber(config.submissionsPerSubmitter)
        && isString(config.scorecardId)
        && isPrizeTuple(config.prizes)
        && isString(config.submissionZipPath)
}

export const validateFirst2FinishConfig = (config: unknown): config is First2FinishConfig => {
    if (!isRecord(config)) {
        return false
    }

    return isString(config.challengeNamePrefix)
        && isNumber(config.projectId)
        && isString(config.challengeTypeId)
        && isString(config.challengeTrackId)
        && isString(config.timelineTemplateId)
        && isString(config.copilotHandle)
        && isString(config.reviewer)
        && isStringArray(config.submitters)
        && isString(config.scorecardId)
        && isNumber(config.prize)
        && isString(config.submissionZipPath)
}

// eslint-disable-next-line complexity
export const validateDesignConfig = (config: unknown): config is DesignConfig => {
    if (!isRecord(config)) {
        return false
    }

    return isString(config.challengeNamePrefix)
        && isNumber(config.projectId)
        && isString(config.challengeTypeId)
        && isString(config.challengeTrackId)
        && isString(config.timelineTemplateId)
        && isString(config.copilotHandle)
        && isString(config.reviewer)
        && isOptionalString(config.screener)
        && isOptionalString(config.screeningReviewer)
        && isOptionalString(config.approver)
        && isOptionalString(config.checkpointScreener)
        && isOptionalString(config.checkpointReviewer)
        && isStringArray(config.submitters)
        && isNumber(config.submissionsPerSubmitter)
        && isString(config.scorecardId)
        && isOptionalString(config.reviewScorecardId)
        && isOptionalString(config.screeningScorecardId)
        && isOptionalString(config.approvalScorecardId)
        && isString(config.checkpointScorecardId)
        && isOptionalString(config.checkpointScreeningScorecardId)
        && isOptionalString(config.checkpointReviewScorecardId)
        && isPrizeTuple(config.prizes)
        && isNumber(config.checkpointPrizeAmount)
        && isNumber(config.checkpointPrizeCount)
        && isString(config.submissionZipPath)
}

export const validateAppConfig = (config: unknown): config is AppConfig => {
    if (!isRecord(config)) {
        return false
    }

    return validateFullChallengeConfig(config.fullChallenge)
        && validateFirst2FinishConfig(config.first2finish)
        && validateFirst2FinishConfig(config.topgear)
        && validateDesignConfig(config.designChallenge)
        && validateDesignConfig(config.designFailScreeningChallenge)
        && validateDesignConfig(config.designFailReviewChallenge)
        && validateFullChallengeConfig(config.designSingleChallenge)
}
