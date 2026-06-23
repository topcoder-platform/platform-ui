import { FormSelectOption } from '../../../../lib/components/form'
import { CREATE_CHALLENGE_TYPES_BY_TRACK } from '../../../../lib/constants/challenge-editor.constants'
import {
    ChallengeType,
    Track,
} from '../../../../lib/models'

const TOPGEAR_TASK_ABBREVIATION = 'TGT'
const TOPGEAR_TASK_NAME = 'TOPGEARTASK'
const MARATHON_MATCH_ABBREVIATION = 'MM'
const MARATHON_MATCH_NAME = 'MARATHONMATCH'
const TRACK_ALIASES: Record<string, string> = {
    DATA_SCIENCE: 'DATA_SCIENCE',
    DATASCIENCE: 'DATA_SCIENCE',
    DES: 'DESIGN',
    DESIGN: 'DESIGN',
    DEV: 'DEVELOP',
    DEVELOP: 'DEVELOP',
    DEVELOPMENT: 'DEVELOP',
    DS: 'DATA_SCIENCE',
    QA: 'QA',
    QUALITY_ASSURANCE: 'QA',
    QUALITYASSURANCE: 'QA',
}

function normalizeTrackToken(value: unknown): string {
    if (value === undefined || value === null) {
        return ''
    }

    return String(value)
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '_')
}

function normalizeChallengeTypeToken(value: unknown): string {
    if (value === undefined || value === null) {
        return ''
    }

    return String(value)
        .trim()
        .toUpperCase()
        .replaceAll(/[\s_-]+/g, '')
}

/**
 * Resolves a track config key to the canonical token used by work-app challenge type filters.
 *
 * @param track track key from `CREATE_CHALLENGE_TYPES_BY_TRACK`.
 * @returns canonical track token, or an empty string when the key is blank.
 * @remarks Used while loading create-challenge type allowlist config so deployment config can use
 * either API tokens such as `DEVELOP` and `QA` or display tokens such as `Development`.
 * @throws Does not throw.
 */
function getConfiguredTrackToken(track: string): string {
    const normalizedTrack = normalizeTrackToken(track)

    if (!normalizedTrack) {
        return ''
    }

    return TRACK_ALIASES[normalizedTrack] || normalizedTrack
}

/**
 * Converts configured challenge type names into normalized tokens keyed by canonical track.
 *
 * @param challengeTypesByTrack environment-backed create-challenge type allowlist.
 * @returns normalized challenge type tokens grouped by normalized track token.
 * @remarks Used by `buildChallengeTypeOptions` to compare API challenge types against configured
 * display names without depending on challenge type ids.
 * @throws Does not throw.
 */
function buildAllowedChallengeTypeTokensByTrack(
    challengeTypesByTrack: Record<string, string[]>,
): Record<string, ReadonlySet<string>> {
    return Object.entries(challengeTypesByTrack)
        .reduce<Record<string, Set<string>>>((result, [track, challengeTypeNames]) => {
            const normalizedTrack = getConfiguredTrackToken(track)

            if (!normalizedTrack) {
                return result
            }

            const typeTokens = challengeTypeNames
                .map(normalizeChallengeTypeToken)
                .filter(Boolean)

            if (typeTokens.length < 1) {
                return result
            }

            result[normalizedTrack] = new Set<string>([
                ...Array.from(result[normalizedTrack] || []),
                ...typeTokens,
            ])

            return result
        }, {})
}

const ALLOWED_CHALLENGE_TYPE_TOKENS_BY_TRACK = buildAllowedChallengeTypeTokensByTrack(
    CREATE_CHALLENGE_TYPES_BY_TRACK,
)

const ALL_ALLOWED_CHALLENGE_TYPE_TOKENS = new Set<string>(
    Object.values(ALLOWED_CHALLENGE_TYPE_TOKENS_BY_TRACK)
        .flatMap(typeTokens => Array.from(typeTokens)),
)

/**
 * Gets the configured create-challenge type tokens for a selected track.
 *
 * @param challengeTrack selected challenge track metadata from `useFetchChallengeTracks`.
 * @returns allowed challenge type tokens for the selected track; when no track is selected, the
 * union of configured type tokens across all tracks is returned.
 * @remarks Used by the work challenge editor so AI-only rating challenge types and other internal
 * API rows are not exposed in the create challenge dropdown.
 * @throws Does not throw.
 */
function getAllowedChallengeTypeTokens(
    challengeTrack?: Track,
): ReadonlySet<string> {
    const normalizedTrack = getChallengeTypeFilterTrack(challengeTrack)

    if (!normalizedTrack) {
        return ALL_ALLOWED_CHALLENGE_TYPE_TOKENS
    }

    return ALLOWED_CHALLENGE_TYPE_TOKENS_BY_TRACK[normalizedTrack] || new Set<string>()
}

/**
 * Resolves challenge track metadata to the canonical track token used by work-manager filters.
 *
 * @param challengeTrack challenge track metadata returned by `useFetchChallengeTracks`.
 * @returns normalized track token, or an empty string when no track is selected.
 * @remarks Used by the work challenge editor to apply track-specific create-challenge type
 * allowlists while tolerating challenge-track API naming differences.
 * @throws Does not throw.
 */
export function getChallengeTypeFilterTrack(
    challengeTrack?: Track,
): string {
    const normalizedTrack = normalizeTrackToken(
        challengeTrack?.track || challengeTrack?.name || challengeTrack?.abbreviation,
    )

    if (!normalizedTrack) {
        return ''
    }

    return TRACK_ALIASES[normalizedTrack] || normalizedTrack
}

/**
 * Determines whether a challenge type represents the non-launchable Topgear Task flow.
 *
 * @param challengeType challenge type metadata returned by the challenge types API.
 * @returns `true` when the type matches Topgear Task by abbreviation or normalized name;
 * otherwise `false`.
 * @remarks Used by the work challenge editor to keep Topgear Task out of the create-flow
 * dropdown while leaving other challenge-type consumers unchanged.
 * @throws Does not throw.
 */
export function isTopgearTaskChallengeType(challengeType: ChallengeType): boolean {
    const normalizedAbbreviation = normalizeChallengeTypeToken(challengeType.abbreviation)
    const normalizedName = normalizeChallengeTypeToken(challengeType.name)

    return normalizedAbbreviation === TOPGEAR_TASK_ABBREVIATION
        || normalizedName === TOPGEAR_TASK_NAME
}

/**
 * Determines whether a challenge type represents Marathon Match.
 *
 * @param challengeType challenge type metadata returned by the challenge types API.
 * @returns `true` when the type matches Marathon Match by abbreviation or normalized name;
 * otherwise `false`.
 * @remarks Used by work challenge editor helpers that need Marathon Match-specific behavior.
 * @throws Does not throw.
 */
export function isMarathonMatchChallengeType(challengeType: ChallengeType): boolean {
    const normalizedAbbreviation = normalizeChallengeTypeToken(challengeType.abbreviation)
    const normalizedName = normalizeChallengeTypeToken(challengeType.name)

    return normalizedAbbreviation === MARATHON_MATCH_ABBREVIATION
        || normalizedName === MARATHON_MATCH_NAME
}

/**
 * Determines whether a challenge type is included in the create-challenge allowlist.
 *
 * @param challengeType challenge type metadata returned by the challenge types API.
 * @param allowedTypeTokens configured type tokens for the selected challenge track.
 * @returns `true` when the challenge type matches by normalized name or abbreviation.
 * @remarks Used by the work challenge editor to hide rating-specific and internal challenge types
 * that may be active in the challenge API but should not be launched from platform-ui.
 * @throws Does not throw.
 */
function isAllowedCreateChallengeType(
    challengeType: ChallengeType,
    allowedTypeTokens: ReadonlySet<string>,
): boolean {
    return allowedTypeTokens.has(normalizeChallengeTypeToken(challengeType.name))
        || allowedTypeTokens.has(normalizeChallengeTypeToken(challengeType.abbreviation))
}

/**
 * Builds the launchable challenge type options shown in the challenge editor.
 *
 * @param challengeTypes full challenge type metadata returned by `useFetchChallengeTypes`.
 * @param challengeTrack selected challenge track metadata from `useFetchChallengeTracks`.
 * @returns active challenge types included in the configured create-challenge allowlist, sorted by
 * display name and mapped to select options. Topgear Task remains hidden even if API data is active.
 * @remarks Used exclusively by `ChallengeTypeField` in the work app so users can only launch
 * supported challenge types from this editor.
 * @throws Does not throw.
 */
export function buildChallengeTypeOptions(
    challengeTypes: ChallengeType[],
    challengeTrack?: Track,
): FormSelectOption[] {
    const allowedTypeTokens = getAllowedChallengeTypeTokens(challengeTrack)

    return challengeTypes
        .filter(type => (
            type.isActive
            && !isTopgearTaskChallengeType(type)
            && isAllowedCreateChallengeType(type, allowedTypeTokens)
        ))
        .sort((typeA, typeB) => typeA.name.localeCompare(typeB.name))
        .map(type => ({
            label: type.name,
            value: type.id,
        }))
}
