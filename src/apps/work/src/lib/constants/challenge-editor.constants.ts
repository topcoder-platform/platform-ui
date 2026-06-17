import { EnvironmentConfig } from '../../../../../config'

export const SPECIAL_CHALLENGE_TAGS: string[] = [
    'Marathon Match',
    'Rapid Development Match',
]

export type CreateChallengeTypesByTrack = Record<string, string[]>

const DEFAULT_CREATE_CHALLENGE_TYPES_BY_TRACK: CreateChallengeTypesByTrack = {
    DATA_SCIENCE: [
        'Challenge',
        'First2Finish',
        'Marathon Match',
        'Task',
    ],
    DESIGN: [
        'Challenge',
        'First2Finish',
        'Task',
    ],
    DEVELOP: [
        'Challenge',
        'First2Finish',
        'Marathon Match',
        'Task',
    ],
    QA: [
        'Challenge',
        'First2Finish',
        'Task',
    ],
}

/**
 * Normalizes the configured create-challenge type allowlist for the work app.
 *
 * @param configValue environment config value from `WORK_CREATE_CHALLENGE_TYPES_BY_TRACK`.
 * @returns configured track-to-type names when valid; otherwise the default work-app allowlist.
 * @remarks Used by the create challenge type dropdown to keep hidden rating-specific types out of
 * the launch flow while allowing deployment config to override the allowlist.
 * @throws Does not throw.
 */
function parseCreateChallengeTypesByTrack(
    configValue: unknown,
): CreateChallengeTypesByTrack {
    if (!configValue || Array.isArray(configValue) || typeof configValue !== 'object') {
        return DEFAULT_CREATE_CHALLENGE_TYPES_BY_TRACK
    }

    const config = Object.entries(configValue)
        .reduce<CreateChallengeTypesByTrack>((result, [track, challengeTypes]) => {
            if (!Array.isArray(challengeTypes)) {
                return result
            }

            const normalizedChallengeTypes = challengeTypes
                .filter((challengeType): challengeType is string => (
                    typeof challengeType === 'string' && challengeType.trim().length > 0
                ))
                .map(challengeType => challengeType.trim())

            if (track.trim().length > 0 && normalizedChallengeTypes.length > 0) {
                result[track.trim()] = normalizedChallengeTypes
            }

            return result
        }, {})

    return Object.keys(config).length > 0 ? config : DEFAULT_CREATE_CHALLENGE_TYPES_BY_TRACK
}

export const CREATE_CHALLENGE_TYPES_BY_TRACK = parseCreateChallengeTypesByTrack(
    (EnvironmentConfig as unknown as Record<string, unknown>)
        .WORK_CREATE_CHALLENGE_TYPES_BY_TRACK,
)

export const SKILLS_OPTIONAL_BILLING_ACCOUNT_IDS: string[] = ['80000062']

export const MAX_CHALLENGE_NAME_LENGTH = 200

export const MAX_DESCRIPTION_LENGTH = 16000

export const MIN_DESCRIPTION_LENGTH = 10

export const PHASE_DURATION_MIN_MINUTES = 1

export const PHASE_DURATION_MAX_HOURS = 720

export const DEFAULT_TIME_INTERVAL_MINUTES = 15

export const DATE_TIME_FORMAT = 'MM/dd/yyyy HH:mm'

export const AUTOSAVE_DELAY_MS = 10000

export const SKILLS_SEARCH_DEBOUNCE_MS = 300

export const MAX_PRIZE_VALUE = 1000000

export const MAX_MANUAL_REVIEWER_COUNT = 20

export const MAX_CHECKPOINT_PRIZE_COUNT = 8

export const DEFAULT_CHECKPOINT_PRIZE = 50

export const DEFAULT_CHECKPOINT_PRIZE_COUNT = 5

export const PRIZE_SET_TYPES = {
    CHECKPOINT: 'CHECKPOINT',
    COPILOT: 'COPILOT',
    PLACEMENT: 'PLACEMENT',
    REVIEWER: 'REVIEWER',
} as const

export const PRIZE_TYPES = {
    POINT: 'POINT',
    USD: 'USD',
} as const

export const CHALLENGE_TYPES_WITH_MULTIPLE_PRIZES = [
    {
        abbreviation: 'CH',
        name: 'Challenge',
    },
    {
        abbreviation: 'MM',
        name: 'Marathon Match',
    },
] as const

export const DEFAULT_NDA_UUID = 'e5811a7b-43d1-407a-a064-69e5015b4900'

export const DEFAULT_STANDARD_TERMS_UUID = process.env.REACT_APP_DEFAULT_STANDARD_TERMS_UUID
    || process.env.DEFAULT_STANDARD_TERMS_UUID
    || EnvironmentConfig.DEFAULT_STANDARD_TERMS_UUID

export const ROUND_TYPES = {
    SINGLE_ROUND: 'Single round',
    TWO_ROUNDS: 'Two rounds',
} as const

export const DESIGN_WORK_TYPES = [
    'Application Front-End Design',
    'Print/Presentation',
    'Web Design',
    'Widget or Mobile Screen Design',
    'Wireframes',
] as const

export const REVIEW_TYPES = {
    COMMUNITY: 'COMMUNITY',
    EXAMPLE: 'EXAMPLE',
    INTERNAL: 'INTERNAL',
    PROVISIONAL: 'PROVISIONAL',
    SYSTEM: 'SYSTEM',
} as const

export const AUTOCOMPLETE_MIN_LENGTH = 3

export const AUTOCOMPLETE_DEBOUNCE_TIME_MS = 300
