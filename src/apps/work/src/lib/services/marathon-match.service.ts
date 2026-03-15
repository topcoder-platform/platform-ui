/* eslint-disable unicorn/no-null */

import {
    xhrGetAsync,
    xhrGetPaginatedAsync,
    xhrPostAsync,
    xhrPutAsync,
} from '~/libs/core'
import { EnvironmentConfig } from '~/config'

import {
    CreateMarathonMatchConfigInput,
    CreateTesterInput,
    CreateTesterVersionInput,
    MarathonMatchCompilationStatus,
    MarathonMatchConfig,
    MarathonMatchDefaults,
    MarathonMatchPhaseConfig,
    MarathonMatchScoreDirection,
    MarathonMatchTester,
    MarathonMatchTesterSummary,
    UpdateMarathonMatchConfigInput,
} from '../models'

const MARATHON_MATCH_API_URL = EnvironmentConfig.MARATHON_MATCH_API
    || `${EnvironmentConfig.API.V6}/marathon-match`
const TESTERS_PER_PAGE = 100

interface TesterListMetadata {
    page?: number
    perPage?: number
    totalPages?: number
}

export interface FetchTestersParams {
    fetchAll?: boolean
    name?: string
    page?: number
    perPage?: number
}

function normalizeText(value: unknown): string | undefined {
    if (value === undefined || value === null) {
        return undefined
    }

    const normalizedValue = String(value)
        .trim()

    return normalizedValue || undefined
}

function normalizeCodeText(value: unknown): string | undefined {
    if (value === undefined || value === null) {
        return undefined
    }

    const normalizedValue = String(value)

    return normalizedValue || undefined
}

function normalizeNumber(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') {
        return undefined
    }

    const parsedValue = Number(value)

    return Number.isFinite(parsedValue)
        ? parsedValue
        : undefined
}

/**
 * Normalizes a positive integer query value used for pagination.
 * Returns `undefined` when the value is missing, non-numeric, or less than 1.
 */
function normalizePositiveInteger(value: unknown): number | undefined {
    const normalizedValue = normalizeNumber(value)

    if (normalizedValue === undefined) {
        return undefined
    }

    const integerValue = Math.trunc(normalizedValue)

    return integerValue > 0
        ? integerValue
        : undefined
}

function normalizeBoolean(value: unknown): boolean | undefined {
    if (typeof value === 'boolean') {
        return value
    }

    return undefined
}

function normalizeError(error: unknown, fallbackMessage: string): Error {
    const typedError = error as {
        message?: string
        response?: {
            data?: {
                message?: string
            }
        }
    }

    return new Error(
        typedError?.response?.data?.message
        || typedError?.message
        || fallbackMessage,
    )
}

function normalizePhaseConfig(
    phaseConfig: unknown,
): MarathonMatchPhaseConfig | undefined {
    if (typeof phaseConfig !== 'object' || !phaseConfig) {
        return undefined
    }

    const typedPhaseConfig = phaseConfig as Record<string, unknown>
    const configType = normalizeText(typedPhaseConfig.configType) as MarathonMatchPhaseConfig['configType'] | undefined
    const startSeed = normalizeNumber(typedPhaseConfig.startSeed)
    const numberOfTests = normalizeNumber(typedPhaseConfig.numberOfTests)
    const phaseId = normalizeText(typedPhaseConfig.phaseId)

    if (!configType || startSeed === undefined || numberOfTests === undefined || !phaseId) {
        return undefined
    }

    return {
        configType,
        id: normalizeText(typedPhaseConfig.id),
        numberOfTests,
        phaseId,
        startSeed,
    }
}

/**
 * Normalizes a raw marathon match config API response into a typed config object.
 * Returns `undefined` when required config fields are missing.
 */
// eslint-disable-next-line complexity
function normalizeMarathonMatchConfig(
    config: unknown,
): MarathonMatchConfig | undefined {
    if (typeof config !== 'object' || !config) {
        return undefined
    }

    const typedConfig = config as Record<string, unknown>
    const id = normalizeText(typedConfig.id)
    const challengeId = normalizeText(typedConfig.challengeId)
    const name = normalizeText(typedConfig.name)
    const active = normalizeBoolean(typedConfig.active)
    const relativeScoringEnabled = normalizeBoolean(typedConfig.relativeScoringEnabled)
    const scoreDirection = normalizeText(typedConfig.scoreDirection) as MarathonMatchScoreDirection | undefined
    const reviewScorecardId = normalizeText(typedConfig.reviewScorecardId)
    const testerId = normalizeText(typedConfig.testerId)
    const testTimeout = normalizeNumber(typedConfig.testTimeout)
    const compileTimeout = normalizeNumber(typedConfig.compileTimeout)
    const taskDefinitionName = normalizeText(typedConfig.taskDefinitionName)
    const taskDefinitionVersion = normalizeText(typedConfig.taskDefinitionVersion)
    const createdAt = normalizeText(typedConfig.createdAt)
    const updatedAt = normalizeText(typedConfig.updatedAt)

    if (
        !id
        || !challengeId
        || !name
        || active === undefined
        || relativeScoringEnabled === undefined
        || !scoreDirection
        || !reviewScorecardId
        || !testerId
        || testTimeout === undefined
        || compileTimeout === undefined
        || !taskDefinitionName
        || !taskDefinitionVersion
        || !createdAt
        || !updatedAt
    ) {
        return undefined
    }

    return {
        active,
        challengeId,
        compileTimeout,
        createdAt,
        example: typedConfig.example === null
            ? null
            : normalizePhaseConfig(typedConfig.example) || null,
        id,
        name,
        provisional: typedConfig.provisional === null
            ? null
            : normalizePhaseConfig(typedConfig.provisional) || null,
        relativeScoringEnabled,
        reviewScorecardId,
        scoreDirection,
        system: typedConfig.system === null
            ? null
            : normalizePhaseConfig(typedConfig.system) || null,
        taskDefinitionName,
        taskDefinitionVersion,
        testerId,
        testTimeout,
        updatedAt,
    }
}

/**
 * Normalizes a raw tester-list API response into a typed tester summary object.
 * Returns `undefined` when required tester summary fields are missing.
 */
function normalizeTesterSummary(
    tester: unknown,
): MarathonMatchTesterSummary | undefined {
    if (typeof tester !== 'object' || !tester) {
        return undefined
    }

    const typedTester = tester as Record<string, unknown>
    const id = normalizeText(typedTester.id)
    const name = normalizeText(typedTester.name)
    const version = normalizeText(typedTester.version)
    const className = normalizeText(typedTester.className)
    const compilationStatus = normalizeText(typedTester.compilationStatus) as MarathonMatchCompilationStatus | undefined
    const createdAt = normalizeText(typedTester.createdAt)
    const updatedAt = normalizeText(typedTester.updatedAt)

    if (
        !id
        || !name
        || !version
        || !className
        || !compilationStatus
        || !createdAt
        || !updatedAt
    ) {
        return undefined
    }

    return {
        className,
        compilationError: normalizeText(typedTester.compilationError) || null,
        compilationStatus,
        createdAt,
        id,
        name,
        updatedAt,
        version,
    }
}

/**
 * Normalizes a raw tester API response into a typed tester object.
 * Returns `undefined` when required tester fields are missing.
 */
function normalizeTester(
    tester: unknown,
): MarathonMatchTester | undefined {
    const testerSummary = normalizeTesterSummary(tester)

    if (!testerSummary || typeof tester !== 'object' || !tester) {
        return undefined
    }

    const typedTester = tester as Record<string, unknown>
    const sourceCode = normalizeCodeText(typedTester.sourceCode)

    if (!sourceCode) {
        return undefined
    }

    return {
        ...testerSummary,
        sourceCode,
    }
}

function normalizeMarathonMatchDefaults(
    defaults: unknown,
): MarathonMatchDefaults | undefined {
    if (typeof defaults !== 'object' || !defaults) {
        return undefined
    }

    const typedDefaults = defaults as Record<string, unknown>
    const reviewScorecardId = normalizeText(typedDefaults.reviewScorecardId)
    const testTimeout = normalizeNumber(typedDefaults.testTimeout)
    const compileTimeout = normalizeNumber(typedDefaults.compileTimeout)

    if (!reviewScorecardId || testTimeout === undefined || compileTimeout === undefined) {
        return undefined
    }

    return {
        compileTimeout,
        reviewScorecardId,
        testTimeout,
    }
}

function serializePhaseConfig(
    phaseConfig: MarathonMatchPhaseConfig | undefined,
): Record<string, unknown> | undefined {
    if (!phaseConfig) {
        return undefined
    }

    return {
        configType: phaseConfig.configType,
        numberOfTests: Number(phaseConfig.numberOfTests),
        phaseId: String(phaseConfig.phaseId || '')
            .trim(),
        startSeed: Number(phaseConfig.startSeed),
    }
}

function serializeCreateInput(
    input: CreateMarathonMatchConfigInput,
): Record<string, unknown> {
    return {
        active: input.active,
        compileTimeout: Number(input.compileTimeout),
        example: serializePhaseConfig(input.example),
        name: String(input.name || '')
            .trim(),
        provisional: serializePhaseConfig(input.provisional),
        relativeScoringEnabled: input.relativeScoringEnabled,
        reviewScorecardId: String(input.reviewScorecardId || '')
            .trim(),
        scoreDirection: input.scoreDirection,
        submissionApiUrl: normalizeText(input.submissionApiUrl),
        system: serializePhaseConfig(input.system),
        taskDefinitionName: String(input.taskDefinitionName || '')
            .trim(),
        taskDefinitionVersion: String(input.taskDefinitionVersion || '')
            .trim(),
        testerId: String(input.testerId || '')
            .trim(),
        testTimeout: Number(input.testTimeout),
    }
}

function serializeUpdateInput(
    input: UpdateMarathonMatchConfigInput,
): Record<string, unknown> {
    return {
        active: input.active,
        compileTimeout: input.compileTimeout === undefined
            ? undefined
            : Number(input.compileTimeout),
        example: serializePhaseConfig(input.example),
        name: normalizeText(input.name),
        provisional: serializePhaseConfig(input.provisional),
        relativeScoringEnabled: input.relativeScoringEnabled,
        reviewScorecardId: normalizeText(input.reviewScorecardId),
        scoreDirection: input.scoreDirection,
        submissionApiUrl: normalizeText(input.submissionApiUrl),
        system: serializePhaseConfig(input.system),
        taskDefinitionName: normalizeText(input.taskDefinitionName),
        taskDefinitionVersion: normalizeText(input.taskDefinitionVersion),
        testerId: normalizeText(input.testerId),
        testTimeout: input.testTimeout === undefined
            ? undefined
            : Number(input.testTimeout),
    }
}

function normalizeTesterCollection(response: unknown): MarathonMatchTesterSummary[] {
    if (Array.isArray(response)) {
        return response
            .map(normalizeTesterSummary)
            .filter((tester): tester is MarathonMatchTesterSummary => !!tester)
    }

    if (typeof response !== 'object' || !response) {
        return []
    }

    const typedResponse = response as Record<string, unknown>
    const rawTesters = Array.isArray(typedResponse.testers)
        ? typedResponse.testers
        : []

    return rawTesters
        .map(normalizeTesterSummary)
        .filter((tester): tester is MarathonMatchTesterSummary => !!tester)
}

/**
 * Extracts tester-list pagination metadata from the response payload.
 * Used by `fetchTesters` to keep paging resilient when header metadata is absent.
 */
function extractTesterListMetadata(
    response: unknown,
): TesterListMetadata {
    if (typeof response !== 'object' || !response) {
        return {}
    }

    const typedResponse = response as Record<string, unknown>
    const metadata = typedResponse.metadata

    if (typeof metadata !== 'object' || !metadata) {
        return {}
    }

    const typedMetadata = metadata as Record<string, unknown>

    return {
        page: normalizePositiveInteger(typedMetadata.page),
        perPage: normalizePositiveInteger(typedMetadata.perPage),
        totalPages: normalizePositiveInteger(typedMetadata.totalPages),
    }
}

/**
 * Builds the tester list URL with optional filtering and pagination.
 * Used by `fetchTesters` for both the first page and any remaining page requests.
 */
function buildTesterListUrl(
    params: FetchTestersParams,
): string {
    const query = new URLSearchParams()
    const normalizedName = normalizeText(params.name)
    const page = normalizePositiveInteger(params.page) || 1
    const perPage = normalizePositiveInteger(params.perPage) || TESTERS_PER_PAGE

    if (normalizedName) {
        query.set('name', normalizedName)
    }

    query.set('page', String(page))
    query.set('perPage', String(perPage))

    return `${MARATHON_MATCH_API_URL}/testers?${query.toString()}`
}

/**
 * Loads the default review scorecard and timeout values for the scorer editor.
 * @returns Default scorer values used to initialize new marathon match configs.
 * @throws Error When the API request fails or returns an invalid defaults payload.
 * Used by `MarathonMatchScorerSection` before a challenge-specific config exists.
 */
export async function fetchMarathonMatchDefaults(): Promise<MarathonMatchDefaults> {
    try {
        const response = await xhrGetAsync<unknown>(
            `${MARATHON_MATCH_API_URL}/challenge/defaults`,
        )
        const normalizedDefaults = normalizeMarathonMatchDefaults(response)

        if (!normalizedDefaults) {
            throw new Error('Marathon match defaults response was invalid')
        }

        return normalizedDefaults
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch marathon match defaults')
    }
}

/**
 * Loads the scorer configuration for a challenge.
 * @param challengeId Challenge identifier used in the config route path.
 * @returns The saved scorer config, or `undefined` when no config exists yet.
 * @throws Error When the API request fails with a non-404 error or returns invalid data.
 * Used by `MarathonMatchScorerSection` to hydrate local editor state.
 */
export async function fetchMarathonMatchConfig(
    challengeId: string,
): Promise<MarathonMatchConfig | undefined> {
    try {
        const response = await xhrGetAsync<unknown>(
            `${MARATHON_MATCH_API_URL}/challenge/${encodeURIComponent(challengeId.trim())}`,
        )

        const normalizedConfig = normalizeMarathonMatchConfig(response)

        if (!normalizedConfig) {
            throw new Error('Marathon match configuration response was invalid')
        }

        return normalizedConfig
    } catch (error) {
        const typedError = error as {
            response?: {
                status?: number
            }
            status?: number
        }
        const status = typedError?.status || typedError?.response?.status

        if (status === 404) {
            return undefined
        }

        throw normalizeError(error, 'Failed to fetch marathon match configuration')
    }
}

/**
 * Creates a scorer configuration for a challenge.
 * @param challengeId Challenge identifier used in the config route path.
 * @param input Create payload containing tester, timeout, and phase settings.
 * @returns The newly created scorer configuration.
 * @throws Error When the API request fails or returns an invalid config payload.
 * Used by `MarathonMatchScorerSection` when saving a config for the first time.
 */
export async function createMarathonMatchConfig(
    challengeId: string,
    input: CreateMarathonMatchConfigInput,
): Promise<MarathonMatchConfig> {
    try {
        const response = await xhrPostAsync<Record<string, unknown>, unknown>(
            `${MARATHON_MATCH_API_URL}/challenge/${encodeURIComponent(challengeId.trim())}`,
            serializeCreateInput(input),
        )
        const normalizedConfig = normalizeMarathonMatchConfig(response)

        if (!normalizedConfig) {
            throw new Error('Marathon match configuration response was invalid')
        }

        return normalizedConfig
    } catch (error) {
        throw normalizeError(error, 'Failed to create marathon match configuration')
    }
}

/**
 * Updates an existing scorer configuration for a challenge.
 * @param challengeId Challenge identifier used in the config route path.
 * @param input Partial update payload containing changed scorer settings.
 * @returns The updated scorer configuration.
 * @throws Error When the API request fails or returns an invalid config payload.
 * Used by `MarathonMatchScorerSection` after a config already exists.
 */
export async function updateMarathonMatchConfig(
    challengeId: string,
    input: UpdateMarathonMatchConfigInput,
): Promise<MarathonMatchConfig> {
    try {
        const response = await xhrPutAsync<Record<string, unknown>, unknown>(
            `${MARATHON_MATCH_API_URL}/challenge/${encodeURIComponent(challengeId.trim())}`,
            serializeUpdateInput(input),
        )
        const normalizedConfig = normalizeMarathonMatchConfig(response)

        if (!normalizedConfig) {
            throw new Error('Marathon match configuration response was invalid')
        }

        return normalizedConfig
    } catch (error) {
        throw normalizeError(error, 'Failed to update marathon match configuration')
    }
}

/**
 * Lists available testers for scorer configuration.
 * @param params Optional tester-name filter and pagination controls.
 * Pass `fetchAll: false` to read only the requested page; otherwise all pages are merged.
 * @returns A normalized list of tester summaries available for selection.
 * @throws Error When the API request fails.
 * Used by `MarathonMatchScorerSection` to populate the tester dropdown.
 */
export async function fetchTesters(
    params: FetchTestersParams = {},
): Promise<MarathonMatchTesterSummary[]> {
    try {
        const page = normalizePositiveInteger(params.page) || 1
        const perPage = normalizePositiveInteger(params.perPage) || TESTERS_PER_PAGE
        const firstPageResponse = await xhrGetPaginatedAsync<unknown>(
            buildTesterListUrl({
                ...params,
                page,
                perPage,
            }),
        )
        const firstPageTesters = normalizeTesterCollection(firstPageResponse.data)

        if (params.fetchAll === false) {
            return firstPageTesters
        }

        const payloadMetadata = extractTesterListMetadata(firstPageResponse.data)
        const currentPage = payloadMetadata.page || firstPageResponse.page || page
        const totalPages = Math.max(
            payloadMetadata.totalPages || firstPageResponse.totalPages || currentPage,
            1,
        )

        if (currentPage >= totalPages) {
            return firstPageTesters
        }

        const remainingPageResponses = await Promise.all(
            Array.from({
                length: totalPages - currentPage,
            }, (_, index) => xhrGetPaginatedAsync<unknown>(
                buildTesterListUrl({
                    ...params,
                    page: currentPage + index + 1,
                    perPage,
                }),
            )),
        )

        return Array.from(
            [
                ...firstPageTesters,
                ...remainingPageResponses.flatMap(response => normalizeTesterCollection(response.data)),
            ]
                .reduce<Map<string, MarathonMatchTesterSummary>>((testerMap, tester) => {
                    testerMap.set(tester.id, tester)

                    return testerMap
                }, new Map<string, MarathonMatchTesterSummary>())
                .values(),
        )
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch marathon match testers')
    }
}

/**
 * Loads a single tester by ID.
 * @param id Tester identifier used in the tester detail route path.
 * @returns The normalized tester record for compilation-status polling.
 * @throws Error When the API request fails or returns invalid tester data.
 * Used by `MarathonMatchScorerSection` after tester selection and while polling.
 */
export async function fetchTester(
    id: string,
): Promise<MarathonMatchTester> {
    try {
        const response = await xhrGetAsync<unknown>(
            `${MARATHON_MATCH_API_URL}/testers/${encodeURIComponent(id.trim())}`,
        )
        const normalizedTester = normalizeTester(response)

        if (!normalizedTester) {
            throw new Error('Tester response was invalid')
        }

        return normalizedTester
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch marathon match tester')
    }
}

/**
 * Creates a new tester and triggers asynchronous compilation.
 * @param input Tester create payload containing source, class name, and version.
 * @returns The accepted tester record with initial compilation status.
 * @throws Error When the API request fails or returns invalid tester data.
 * Used by `TesterModal` in create mode.
 */
export async function createTester(
    input: CreateTesterInput,
): Promise<MarathonMatchTester> {
    try {
        const response = await xhrPostAsync<CreateTesterInput, unknown>(
            `${MARATHON_MATCH_API_URL}/testers`,
            {
                className: normalizeText(input.className) || '',
                name: normalizeText(input.name) || '',
                sourceCode: input.sourceCode,
                version: normalizeText(input.version) || '',
            },
        )
        const normalizedTester = normalizeTester(response)

        if (!normalizedTester) {
            throw new Error('Tester response was invalid')
        }

        return normalizedTester
    } catch (error) {
        throw normalizeError(error, 'Failed to create tester')
    }
}

/**
 * Updates an existing tester with a new version and triggers recompilation.
 * @param id Tester identifier used in the tester detail route path.
 * @param input Tester version payload containing the updated source and version metadata.
 * @returns The accepted tester record after the update request succeeds.
 * @throws Error When the API request fails or returns invalid tester data.
 * Used by `TesterModal` in version mode.
 */
export async function createTesterVersion(
    id: string,
    input: CreateTesterVersionInput,
): Promise<MarathonMatchTester> {
    try {
        const response = await xhrPutAsync<CreateTesterVersionInput, unknown>(
            `${MARATHON_MATCH_API_URL}/testers/${encodeURIComponent(id.trim())}`,
            {
                className: normalizeText(input.className) || '',
                sourceCode: input.sourceCode,
                version: normalizeText(input.version) || '',
            },
        )
        const normalizedTester = normalizeTester(response)

        if (!normalizedTester) {
            throw new Error('Tester response was invalid')
        }

        return normalizedTester
    } catch (error) {
        throw normalizeError(error, 'Failed to create tester version')
    }
}

export {
    normalizeMarathonMatchConfig,
    normalizeTester,
    normalizeTesterSummary,
}
