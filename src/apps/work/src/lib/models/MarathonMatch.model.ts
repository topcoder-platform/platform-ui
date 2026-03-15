/**
 * Supported phase configuration types for marathon match scoring.
 * Used by scorer configuration forms and API payloads.
 */
export type MarathonMatchConfigType = 'EXAMPLE' | 'PROVISIONAL' | 'SYSTEM'

/**
 * Supported score directions for relative marathon match scoring.
 * Used when persisting scorer configuration payloads.
 */
export type MarathonMatchScoreDirection = 'MAXIMIZE' | 'MINIMIZE'

/**
 * Supported tester compilation states returned by the marathon match API.
 * Used by the scorer section to show polling and failure feedback.
 */
export type MarathonMatchCompilationStatus = 'PENDING' | 'SUCCESS' | 'FAILED'

/**
 * Configurable default values for creating a marathon match scorer config.
 * Used to pre-populate the scorer editor before a config exists.
 */
export interface MarathonMatchDefaults {
    reviewScorecardId: string
    testTimeout: number
    compileTimeout: number
}

/**
 * Phase-specific scorer settings for a challenge phase.
 * Used in scorer config responses and nested create/update payloads.
 */
export interface MarathonMatchPhaseConfig {
    id?: string
    configType: MarathonMatchConfigType
    startSeed: number
    numberOfTests: number
    phaseId: string
}

/**
 * Persisted marathon match scorer configuration for a challenge.
 * Used by the scorer editor after loading or saving config state.
 */
export interface MarathonMatchConfig {
    id: string
    challengeId: string
    name: string
    active: boolean
    relativeScoringEnabled: boolean
    scoreDirection: MarathonMatchScoreDirection
    reviewScorecardId: string
    testerId: string
    testTimeout: number
    compileTimeout: number
    taskDefinitionName: string
    taskDefinitionVersion: string
    example: MarathonMatchPhaseConfig | null
    provisional: MarathonMatchPhaseConfig | null
    system: MarathonMatchPhaseConfig | null
    createdAt: string | Date
    updatedAt: string | Date
}

/**
 * Persisted tester summary metadata used by the scorer editor.
 * Used for tester selection and version grouping from GET /testers responses.
 */
export interface MarathonMatchTesterSummary {
    id: string
    name: string
    version: string
    className: string
    compilationStatus: MarathonMatchCompilationStatus
    compilationError: string | null
    createdAt: string | Date
    updatedAt: string | Date
}

/**
 * Persisted full tester metadata used by the scorer editor.
 * Used for individual tester reads, versioning, and compilation status polling.
 */
export interface MarathonMatchTester extends MarathonMatchTesterSummary {
    sourceCode: string
}

/**
 * Payload for creating a new marathon match scorer configuration.
 * Used by POST /challenge/:challengeId requests.
 */
export interface CreateMarathonMatchConfigInput {
    name: string
    active?: boolean
    relativeScoringEnabled?: boolean
    scoreDirection?: MarathonMatchScoreDirection
    submissionApiUrl?: string
    reviewScorecardId: string
    testerId: string
    testTimeout: number
    compileTimeout: number
    taskDefinitionName: string
    taskDefinitionVersion: string
    example?: MarathonMatchPhaseConfig
    provisional?: MarathonMatchPhaseConfig
    system?: MarathonMatchPhaseConfig
}

/**
 * Payload for partially updating an existing marathon match scorer configuration.
 * Used by PUT /challenge/:challengeId requests.
 */
export interface UpdateMarathonMatchConfigInput {
    name?: string
    active?: boolean
    relativeScoringEnabled?: boolean
    scoreDirection?: MarathonMatchScoreDirection
    submissionApiUrl?: string
    reviewScorecardId?: string
    testerId?: string
    testTimeout?: number
    compileTimeout?: number
    taskDefinitionName?: string
    taskDefinitionVersion?: string
    example?: MarathonMatchPhaseConfig
    provisional?: MarathonMatchPhaseConfig
    system?: MarathonMatchPhaseConfig
}

/**
 * Payload for creating a new tester record.
 * Used by POST /testers requests from the tester modal.
 */
export interface CreateTesterInput {
    name: string
    version: string
    sourceCode: string
    className: string
}

/**
 * Payload for updating an existing tester with a new version.
 * Used by PUT /testers/:id requests from the tester modal.
 */
export interface CreateTesterVersionInput {
    version: string
    sourceCode: string
    className: string
}
