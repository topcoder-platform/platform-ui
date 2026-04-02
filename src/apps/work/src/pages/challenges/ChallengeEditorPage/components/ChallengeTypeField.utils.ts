import { FormSelectOption } from '../../../../lib/components/form'
import {
    ChallengeType,
    Track,
} from '../../../../lib/models'

const TOPGEAR_TASK_ABBREVIATION = 'TGT'
const TOPGEAR_TASK_NAME = 'topgeartask'
const MARATHON_MATCH_ABBREVIATION = 'MM'
const MARATHON_MATCH_NAME = 'marathonmatch'
const TRACK_ALIASES: Record<string, string> = {
    DES: 'DESIGN',
    DESIGN: 'DESIGN',
    QA: 'QUALITY_ASSURANCE',
    QUALITY_ASSURANCE: 'QUALITY_ASSURANCE',
    QUALITYASSURANCE: 'QUALITY_ASSURANCE',
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

/**
 * Resolves challenge track metadata to the canonical track token used by work-manager filters.
 *
 * @param challengeTrack challenge track metadata returned by `useFetchChallengeTracks`.
 * @returns normalized track token, or an empty string when no track is selected.
 * @remarks Used by the work challenge editor to keep challenge-type filters aligned with the
 * legacy work-manager create flow for Design and QA tracks.
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
    const normalizedAbbreviation = (challengeType.abbreviation || '')
        .trim()
        .toUpperCase()
    const normalizedName = (challengeType.name || '')
        .replaceAll(/\s+/g, '')
        .trim()
        .toLowerCase()

    return normalizedAbbreviation === TOPGEAR_TASK_ABBREVIATION
        || normalizedName === TOPGEAR_TASK_NAME
}

/**
 * Determines whether a challenge type represents Marathon Match.
 *
 * @param challengeType challenge type metadata returned by the challenge types API.
 * @returns `true` when the type matches Marathon Match by abbreviation or normalized name;
 * otherwise `false`.
 * @remarks Used by the work challenge editor to hide Marathon Match for Design and QA tracks
 * while leaving the type available for tracks that still support it.
 * @throws Does not throw.
 */
export function isMarathonMatchChallengeType(challengeType: ChallengeType): boolean {
    const normalizedAbbreviation = (challengeType.abbreviation || '')
        .trim()
        .toUpperCase()
    const normalizedName = (challengeType.name || '')
        .replaceAll(/\s+/g, '')
        .trim()
        .toLowerCase()

    return normalizedAbbreviation === MARATHON_MATCH_ABBREVIATION
        || normalizedName === MARATHON_MATCH_NAME
}

/**
 * Builds the launchable challenge type options shown in the challenge editor.
 *
 * @param challengeTypes full challenge type metadata returned by `useFetchChallengeTypes`.
 * @param challengeTrack selected challenge track metadata from `useFetchChallengeTracks`.
 * @returns active challenge types, excluding Topgear Task, sorted by display name and mapped
 * to select options. Design and QA tracks also exclude Marathon Match to match work-manager.
 * @remarks Used exclusively by `ChallengeTypeField` in the work app so users can only launch
 * supported challenge types from this editor.
 * @throws Does not throw.
 */
export function buildChallengeTypeOptions(
    challengeTypes: ChallengeType[],
    challengeTrack?: Track,
): FormSelectOption[] {
    const normalizedTrack = getChallengeTypeFilterTrack(challengeTrack)
    const shouldHideMarathonMatch = normalizedTrack === 'DESIGN'
        || normalizedTrack === 'QUALITY_ASSURANCE'

    return challengeTypes
        .filter(type => type.isActive && !isTopgearTaskChallengeType(type))
        .filter(type => !shouldHideMarathonMatch || !isMarathonMatchChallengeType(type))
        .sort((typeA, typeB) => typeA.name.localeCompare(typeB.name))
        .map(type => ({
            label: type.name,
            value: type.id,
        }))
}
