/* eslint-disable @typescript-eslint/typedef, complexity, sort-keys */
import {
    membersAutocompete,
} from '~/apps/admin/src/platform/gamification-admin/src/game-lib/member-autocomplete/input-handle-functions'
import { getProjects } from '~/apps/copilots/src/services/projects'
import { fetchTimelineTemplates } from '~/apps/work/src/lib/services/timeline-templates.service'
import { EnvironmentConfig } from '~/config'
import { tokenGetAsync, xhrGetAsync, xhrPutAsync } from '~/libs/core'

import type {
    AppConfig,
    ChallengeTrackOption,
    ChallengeTypeOption,
    DesignConfig,
    First2FinishConfig,
    FlowConfig,
    FlowVariant,
    FullChallengeConfig,
    MemberOption,
    ProjectOption,
    RunMode,
    ScorecardOption,
    TimelineTemplateOption,
    TopgearConfig,
} from './types'

type RecordValue = Record<string, unknown>
type PartialAppConfig = Partial<Record<keyof AppConfig, unknown>>
type QaChallengeTypeRecord = {
    id?: string
    name?: string
}
type QaChallengeTrackRecord = {
    id?: string
    name?: string
    track?: string
}
type QaScorecardRecord = {
    id?: string
    name?: string
}
type QaScorecardsResponse = {
    metadata?: unknown
    scoreCards?: QaScorecardRecord[]
}

export interface RunStreamRequest {
    init: RequestInit
    url: string
}

/**
 * Creates the default full challenge config used by the QA app.
 *
 * @returns Default full challenge config.
 */
function createDefaultFullConfig(): FullChallengeConfig {
    return {
        challengeNamePrefix: 'Autopilot Test - ',
        projectId: 100439,
        challengeTypeId: '927abff4-7af9-4145-8ba1-577c16e64e2e',
        challengeTrackId: '9b6fc876-f4d9-4ccb-9dfd-419247628825',
        timelineTemplateId: 'a5a15ac0-aef4-41bb-97c0-a9d5192eae42',
        copilotHandle: 'TCConnCopilot',
        screener: 'marioskranitsas',
        reviewers: ['liuliquan', 'marioskranitsas'],
        submitters: ['devtest140'],
        submissionsPerSubmitter: 1,
        scorecardId: 'jEChE8UnLAxHTD',
        prizes: [500, 200, 100],
        submissionZipPath: './artifacts/sample-submission.zip',
    }
}

/**
 * Creates the default First2Finish config used by the QA app.
 *
 * @returns Default First2Finish config.
 */
function createDefaultFirst2FinishConfig(): First2FinishConfig {
    return {
        challengeNamePrefix: 'Autopilot F2F - ',
        projectId: 100439,
        challengeTypeId: '927abff4-7af9-4145-8ba1-577c16e64e2e',
        challengeTrackId: '9b6fc876-f4d9-4ccb-9dfd-419247628825',
        timelineTemplateId: '0a0fed34-cb5a-47f5-b0cb-6e2ee7de8dcb',
        copilotHandle: 'TCConnCopilot',
        reviewer: 'marioskranitsas',
        submitters: ['devtest1400', 'devtest141'],
        scorecardId: 'hFU73Ve2XlYCK-',
        prize: 500,
        submissionZipPath: './artifacts/sample-submission.zip',
    }
}

/**
 * Creates the default Topgear config used by the QA app.
 *
 * @returns Default Topgear config.
 */
function createDefaultTopgearConfig(): TopgearConfig {
    return {
        challengeNamePrefix: 'Autopilot Topgear - ',
        projectId: 100439,
        challengeTypeId: '927abff4-7af9-4145-8ba1-577c16e64e2e',
        challengeTrackId: '9b6fc876-f4d9-4ccb-9dfd-419247628825',
        timelineTemplateId: '89be56ae-26a7-4bea-af03-9c9baf67017c',
        copilotHandle: 'TCConnCopilot',
        reviewer: 'marioskranitsas',
        submitters: ['devtest1400'],
        scorecardId: 'hFU73Ve2XlYCK-',
        prize: 500,
        submissionZipPath: './artifacts/sample-submission.zip',
    }
}

/**
 * Creates the default design config used by the QA app.
 *
 * @returns Default design config.
 */
function createDefaultDesignConfig(): DesignConfig {
    return {
        challengeNamePrefix: 'Autopilot Design - ',
        projectId: 100439,
        challengeTypeId: '927abff4-7af9-4145-8ba1-577c16e64e2e',
        challengeTrackId: '9b6fc876-f4d9-4ccb-9dfd-419247628825',
        timelineTemplateId: 'a5a15ac0-aef4-41bb-97c0-a9d5192eae42',
        copilotHandle: 'TCConnCopilot',
        reviewer: 'marioskranitsas',
        screener: 'marioskranitsas',
        screeningReviewer: 'marioskranitsas',
        approver: 'marioskranitsas',
        checkpointScreener: 'marioskranitsas',
        checkpointReviewer: 'marioskranitsas',
        submitters: ['devtest1400'],
        submissionsPerSubmitter: 1,
        scorecardId: 'jEChE8UnLAxHTD',
        checkpointScorecardId: 'jEChE8UnLAxHTD',
        prizes: [500, 200, 100],
        checkpointPrizeAmount: 100,
        checkpointPrizeCount: 5,
        submissionZipPath: './artifacts/sample-submission.zip',
    }
}

/**
 * Creates the default design-single config used by the QA app.
 *
 * @returns Default design-single config.
 */
function createDefaultDesignSingleConfig(): FullChallengeConfig {
    return {
        ...createDefaultFullConfig(),
        timelineTemplateId: '918f6a3e-1a63-4680-8b5e-deb95b1411e7',
    }
}

/**
 * Creates the default persisted QA app config.
 *
 * @returns Default QA app config.
 */
export function createDefaultAppConfig(): AppConfig {
    return {
        fullChallenge: createDefaultFullConfig(),
        first2finish: createDefaultFirst2FinishConfig(),
        topgear: createDefaultTopgearConfig(),
        designChallenge: createDefaultDesignConfig(),
        designFailScreeningChallenge: createDefaultDesignConfig(),
        designFailReviewChallenge: createDefaultDesignConfig(),
        designSingleChallenge: createDefaultDesignSingleConfig(),
    }
}

/**
 * Determines whether the provided value is an object record.
 *
 * @param value Value to test.
 * @returns True when the value is a non-null object.
 */
function isRecord(value: unknown): value is RecordValue {
    return typeof value === 'object' && value !== null
}

function normalizeArrayPayload<T>(value: unknown): T[] {
    if (Array.isArray(value)) {
        return value as T[]
    }

    if (isRecord(value) && Array.isArray(value.data)) {
        return value.data as T[]
    }

    return []
}

/**
 * Returns a normalized string field from an object record.
 *
 * @param record Source object record.
 * @param key Field name.
 * @returns Trimmed string value or an empty string when absent.
 */
function getString(record: RecordValue, key: string): string {
    const value = record[key]
    return typeof value === 'string' ? value : ''
}

/**
 * Returns a normalized number field from an object record.
 *
 * @param record Source object record.
 * @param key Field name.
 * @param fallback Value used when the field is not numeric.
 * @returns Numeric value for the requested field.
 */
function getNumber(record: RecordValue, key: string, fallback = 0): number {
    const value = record[key]
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

/**
 * Returns a normalized string-array field from an object record.
 *
 * @param record Source object record.
 * @param key Field name.
 * @returns List of trimmed string entries.
 */
function getStringArray(record: RecordValue, key: string): string[] {
    const value = record[key]
    return Array.isArray(value)
        ? value
            .map(item => (typeof item === 'string' ? item.trim() : ''))
            .filter(Boolean)
        : []
}

/**
 * Returns a normalized prize tuple from an object record.
 *
 * @param record Source object record.
 * @param key Field name.
 * @param fallback Fallback tuple when parsing fails.
 * @returns Three-item prize tuple.
 */
function getPrizeTuple(
    record: RecordValue,
    key: string,
    fallback: [number, number, number],
): [number, number, number] {
    const value = record[key]
    if (!Array.isArray(value) || value.length < 3) {
        return fallback
    }

    const normalized = value
        .slice(0, 3)
        .map(item => (typeof item === 'number' && Number.isFinite(item) ? item : 0))

    return [normalized[0], normalized[1], normalized[2]]
}

/**
 * Normalizes a full challenge config branch against current defaults.
 *
 * @param value Raw stored config branch.
 * @param fallback Default branch values.
 * @returns Normalized full challenge config.
 */
function normalizeFullChallengeConfig(
    value: unknown,
    fallback: FullChallengeConfig,
): FullChallengeConfig {
    if (!isRecord(value)) {
        return fallback
    }

    return {
        challengeNamePrefix: getString(value, 'challengeNamePrefix') || fallback.challengeNamePrefix,
        projectId: getNumber(value, 'projectId', fallback.projectId),
        challengeTypeId: getString(value, 'challengeTypeId') || fallback.challengeTypeId,
        challengeTrackId: getString(value, 'challengeTrackId') || fallback.challengeTrackId,
        timelineTemplateId: getString(value, 'timelineTemplateId') || fallback.timelineTemplateId,
        copilotHandle: getString(value, 'copilotHandle') || fallback.copilotHandle,
        screener: getString(value, 'screener') || fallback.screener,
        reviewers: getStringArray(value, 'reviewers').length
            ? getStringArray(value, 'reviewers')
            : fallback.reviewers,
        submitters: getStringArray(value, 'submitters').length
            ? getStringArray(value, 'submitters')
            : fallback.submitters,
        submissionsPerSubmitter: getNumber(
            value,
            'submissionsPerSubmitter',
            fallback.submissionsPerSubmitter,
        ),
        scorecardId: getString(value, 'scorecardId') || fallback.scorecardId,
        prizes: getPrizeTuple(value, 'prizes', fallback.prizes),
        submissionZipPath: getString(value, 'submissionZipPath') || fallback.submissionZipPath,
    }
}

/**
 * Normalizes an iterative challenge config branch against current defaults.
 *
 * @param value Raw stored config branch.
 * @param fallback Default branch values.
 * @returns Normalized iterative challenge config.
 */
function normalizeFirst2FinishConfig(
    value: unknown,
    fallback: First2FinishConfig,
): First2FinishConfig {
    if (!isRecord(value)) {
        return fallback
    }

    return {
        challengeNamePrefix: getString(value, 'challengeNamePrefix') || fallback.challengeNamePrefix,
        projectId: getNumber(value, 'projectId', fallback.projectId),
        challengeTypeId: getString(value, 'challengeTypeId') || fallback.challengeTypeId,
        challengeTrackId: getString(value, 'challengeTrackId') || fallback.challengeTrackId,
        timelineTemplateId: getString(value, 'timelineTemplateId') || fallback.timelineTemplateId,
        copilotHandle: getString(value, 'copilotHandle') || fallback.copilotHandle,
        reviewer: getString(value, 'reviewer') || fallback.reviewer,
        submitters: getStringArray(value, 'submitters').length
            ? getStringArray(value, 'submitters')
            : fallback.submitters,
        scorecardId: getString(value, 'scorecardId') || fallback.scorecardId,
        prize: getNumber(value, 'prize', fallback.prize),
        submissionZipPath: getString(value, 'submissionZipPath') || fallback.submissionZipPath,
    }
}

/**
 * Normalizes a design challenge config branch against current defaults.
 *
 * @param value Raw stored config branch.
 * @param fallback Default branch values.
 * @returns Normalized design challenge config.
 */
function normalizeDesignConfig(
    value: unknown,
    fallback: DesignConfig,
): DesignConfig {
    if (!isRecord(value)) {
        return fallback
    }

    return {
        challengeNamePrefix: getString(value, 'challengeNamePrefix') || fallback.challengeNamePrefix,
        projectId: getNumber(value, 'projectId', fallback.projectId),
        challengeTypeId: getString(value, 'challengeTypeId') || fallback.challengeTypeId,
        challengeTrackId: getString(value, 'challengeTrackId') || fallback.challengeTrackId,
        timelineTemplateId: getString(value, 'timelineTemplateId') || fallback.timelineTemplateId,
        copilotHandle: getString(value, 'copilotHandle') || fallback.copilotHandle,
        reviewer: getString(value, 'reviewer') || fallback.reviewer,
        screener: getString(value, 'screener') || fallback.screener,
        screeningReviewer: getString(value, 'screeningReviewer') || fallback.screeningReviewer,
        approver: getString(value, 'approver') || fallback.approver,
        checkpointScreener: getString(value, 'checkpointScreener') || fallback.checkpointScreener,
        checkpointReviewer: getString(value, 'checkpointReviewer') || fallback.checkpointReviewer,
        submitters: getStringArray(value, 'submitters').length
            ? getStringArray(value, 'submitters')
            : fallback.submitters,
        submissionsPerSubmitter: getNumber(
            value,
            'submissionsPerSubmitter',
            fallback.submissionsPerSubmitter,
        ),
        scorecardId: getString(value, 'scorecardId') || fallback.scorecardId,
        reviewScorecardId: getString(value, 'reviewScorecardId') || fallback.reviewScorecardId,
        screeningScorecardId: getString(value, 'screeningScorecardId') || fallback.screeningScorecardId,
        approvalScorecardId: getString(value, 'approvalScorecardId') || fallback.approvalScorecardId,
        checkpointScorecardId: getString(value, 'checkpointScorecardId') || fallback.checkpointScorecardId,
        checkpointScreeningScorecardId:
            getString(value, 'checkpointScreeningScorecardId')
            || fallback.checkpointScreeningScorecardId,
        checkpointReviewScorecardId:
            getString(value, 'checkpointReviewScorecardId')
            || fallback.checkpointReviewScorecardId,
        prizes: getPrizeTuple(value, 'prizes', fallback.prizes),
        checkpointPrizeAmount: getNumber(
            value,
            'checkpointPrizeAmount',
            fallback.checkpointPrizeAmount,
        ),
        checkpointPrizeCount: getNumber(
            value,
            'checkpointPrizeCount',
            fallback.checkpointPrizeCount,
        ),
        submissionZipPath: getString(value, 'submissionZipPath') || fallback.submissionZipPath,
    }
}

/**
 * Normalizes a stored config payload against current defaults.
 *
 * @param stored Raw stored config payload.
 * @returns Normalized QA app config.
 */
function normalizeStoredAppConfig(stored: unknown): AppConfig {
    const defaults = createDefaultAppConfig()
    const value: PartialAppConfig = isRecord(stored) ? stored as PartialAppConfig : {}

    return {
        fullChallenge: normalizeFullChallengeConfig(value.fullChallenge, defaults.fullChallenge),
        first2finish: normalizeFirst2FinishConfig(value.first2finish, defaults.first2finish),
        topgear: normalizeFirst2FinishConfig(value.topgear, defaults.topgear),
        designChallenge: normalizeDesignConfig(value.designChallenge, defaults.designChallenge),
        designFailScreeningChallenge: normalizeDesignConfig(
            value.designFailScreeningChallenge,
            defaults.designFailScreeningChallenge,
        ),
        designFailReviewChallenge: normalizeDesignConfig(
            value.designFailReviewChallenge,
            defaults.designFailReviewChallenge,
        ),
        designSingleChallenge: normalizeFullChallengeConfig(
            value.designSingleChallenge,
            defaults.designSingleChallenge,
        ),
    }
}

/**
 * Loads the persisted QA app config from the QA service.
 *
 * @returns Normalized QA app config persisted for the current user.
 */
export async function fetchAppConfigAsync(): Promise<AppConfig> {
    const response = await xhrGetAsync<unknown>(`${EnvironmentConfig.QA_API}/config`)

    return normalizeStoredAppConfig(response)
}

/**
 * Saves a single QA flow config branch through the QA service.
 *
 * @param flowKey Persisted flow-config branch key.
 * @param config Config payload to persist for that branch.
 */
export async function saveFlowConfigAsync(
    flowKey: keyof AppConfig,
    config: FlowConfig | First2FinishConfig | DesignConfig,
): Promise<void> {
    await xhrPutAsync<
    { config: FlowConfig | First2FinishConfig | DesignConfig },
    void
    >(`${EnvironmentConfig.QA_API}/config/${flowKey}`, { config })
}

/**
 * Fetches QA challenge types from the API.
 *
 * @returns Available challenge type options.
 */
export async function fetchChallengeTypesAsync(): Promise<ChallengeTypeOption[]> {
    const response = await xhrGetAsync<unknown>(`${EnvironmentConfig.QA_API}/refdata/challenge-types`)
    const items = normalizeArrayPayload<QaChallengeTypeRecord>(response)

    return items.map(item => ({
        id: item.id || '',
        name: item.name || '',
    }))
        .filter(item => item.id && item.name)
}

/**
 * Fetches QA challenge tracks from the API.
 *
 * @returns Available challenge track options.
 */
export async function fetchChallengeTracksAsync(): Promise<ChallengeTrackOption[]> {
    const response = await xhrGetAsync<unknown>(`${EnvironmentConfig.QA_API}/refdata/challenge-tracks`)
    const items = normalizeArrayPayload<QaChallengeTrackRecord>(response)

    return items.map(item => ({
        id: item.id || '',
        name: item.name || '',
        track: item.track || '',
    }))
        .filter(item => item.id && item.name && item.track)
}

/**
 * Fetches timeline templates used by the QA config form.
 *
 * @returns Available timeline template options.
 */
export async function fetchTimelineTemplatesAsync(): Promise<TimelineTemplateOption[]> {
    const data = await fetchTimelineTemplates()

    return data.map(item => ({
        id: item.id,
        name: item.name,
        trackId: item.trackId,
        typeId: item.typeId,
    }))
}

/**
 * Fetches project options used by the QA config form.
 *
 * @param search Search term applied to the projects endpoint.
 * @returns Matching project options.
 */
export async function fetchProjectsAsync(search: string): Promise<ProjectOption[]> {
    const data = await getProjects(search)

    return data.map(item => ({
        id: item.id,
        label: `${item.name} (${item.id})`,
        name: item.name,
    }))
}

/**
 * Fetches member-handle options used by the QA config form.
 *
 * @param term Search term applied to the member autocomplete endpoint.
 * @returns Matching member options.
 */
export async function fetchMembersAsync(term: string): Promise<MemberOption[]> {
    const data = await membersAutocompete(term)

    return data.map(item => ({
        label: item.handle,
        value: item.handle,
    }))
}

/**
 * Fetches QA scorecards for the provided challenge type and track.
 *
 * @param challengeType Challenge type name or identifier.
 * @param challengeTrack Challenge track code.
 * @returns Matching scorecard options.
 */
export async function fetchScorecardsAsync(
    challengeType: string,
    challengeTrack: string,
): Promise<ScorecardOption[]> {
    const query = new URLSearchParams({
        challengeTrack,
        challengeType,
    })
    const response = await xhrGetAsync<QaScorecardsResponse>(
        `${EnvironmentConfig.QA_API}/refdata/scorecards?${query.toString()}`,
    )

    return (response?.scoreCards || [])
        .map(item => ({
            id: item.id || '',
            name: item.name || '',
        }))
        .filter(item => item.id && item.name)
}

/**
 * Fetches reviews for a challenge snapshot panel.
 *
 * @param challengeId Challenge identifier.
 * @returns Review payload from the QA API.
 */
export async function fetchChallengeReviewsAsync(challengeId: string): Promise<unknown> {
    return xhrGetAsync<unknown>(
        `${EnvironmentConfig.QA_API}/challenges/${encodeURIComponent(challengeId)}/reviews`,
    )
}

/**
 * Builds the authenticated stream request used by the fetch-based SSE client.
 *
 * @param flow Flow variant to run.
 * @param mode Runner mode.
 * @param toStep Optional stop step for `toStep` mode.
 * @returns Stream URL and `Authorization` header init for `fetch()`.
 * @throws Error when no authenticated access token is available.
 */
export async function buildRunStreamRequestAsync(
    flow: FlowVariant,
    mode: RunMode,
    toStep?: string,
): Promise<RunStreamRequest> {
    const tokenData = await tokenGetAsync()
    const accessToken = typeof tokenData?.token === 'string'
        ? tokenData.token.trim()
        : ''

    if (!accessToken) {
        throw new Error('Authenticated token is required to start the QA runner')
    }

    const streamUrl = new URL(`${EnvironmentConfig.QA_API}/run/stream`)
    streamUrl.searchParams.set('flow', flow)
    streamUrl.searchParams.set('mode', mode)

    if (toStep) {
        streamUrl.searchParams.set('toStep', toStep)
    }

    return {
        init: {
            cache: 'no-store',
            headers: {
                Accept: 'text/event-stream',
                Authorization: `Bearer ${accessToken}`,
            },
        },
        url: streamUrl.toString(),
    }
}
