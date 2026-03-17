import { FormSelectOption } from '../../../../lib/components/form'
import { ChallengeType } from '../../../../lib/models'

const TOPGEAR_TASK_ABBREVIATION = 'TGT'
const TOPGEAR_TASK_NAME = 'topgeartask'

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
 * Builds the launchable challenge type options shown in the challenge editor.
 *
 * @param challengeTypes full challenge type metadata returned by `useFetchChallengeTypes`.
 * @returns active challenge types, excluding Topgear Task, sorted by display name and mapped
 * to select options.
 * @remarks Used exclusively by `ChallengeTypeField` in the work app so users can only launch
 * supported challenge types from this editor.
 * @throws Does not throw.
 */
export function buildChallengeTypeOptions(
    challengeTypes: ChallengeType[],
): FormSelectOption[] {
    return challengeTypes
        .filter(type => type.isActive && !isTopgearTaskChallengeType(type))
        .sort((typeA, typeB) => typeA.name.localeCompare(typeB.name))
        .map(type => ({
            label: type.name,
            value: type.id,
        }))
}
