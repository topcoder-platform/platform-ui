import { UserTrait } from '~/libs/core'

/**
 * Determine whether tool traits should use update or create action.
 * The initial trait prop can be stale while the user stays on the tab,
 * so local list state is also considered to avoid duplicate create calls.
 */
export function shouldUseUpdateTraitAction(
    initialTrait: UserTrait | undefined,
    localTraitsData: UserTrait[] | undefined,
): boolean {
    return Boolean(initialTrait || localTraitsData?.length)
}
