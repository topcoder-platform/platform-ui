import {
    FC,
    useCallback,
    useMemo,
} from 'react'

import {
    FormSelectField,
    FormSelectOption,
} from '../../../../../lib/components/form'
import {
    GITEA_TEAM_SEARCH_DEBOUNCE_TIME_MS,
    GITEA_TEAM_SEARCH_MIN_LENGTH,
} from '../../../../../lib/constants/challenge-editor.constants'
import { GiteaTeam } from '../../../../../lib/models'
import { searchGiteaTeams } from '../../../../../lib/services'
import { normalizeGiteaTeams } from '../../../../../lib/utils/metadata.utils'

const GITEA_TEAMS_HINT = 'Challenge participants will be automatically added to these Gitea teams'
    + ' upon registration and removed if they unregister.'

interface GiteaTeamsFieldProps {
    disabled?: boolean
}

interface GiteaTeamOption extends FormSelectOption {
    team: GiteaTeam
}

/**
 * Builds the option label for a team, naming the organization owning it.
 *
 * Team names are only unique within an organization, so the organization
 * disambiguates the name whenever the teams at hand span more than one.
 *
 * @param team team returned by the search or already stored on the challenge.
 * @param includeOrganization whether the organization is needed to tell teams apart.
 * @returns the label shown in the dropdown and among the selected teams.
 * @throws Does not throw.
 */
function toOptionLabel(team: GiteaTeam, includeOrganization: boolean): string {
    return includeOrganization && team.organization
        ? `${team.name} (${team.organization})`
        : team.name
}

/**
 * Builds the dropdown options for a set of teams.
 *
 * The organization is only appended when the teams come from more than one, so
 * a single-organization Gitea keeps the labels short.
 *
 * @param teams teams returned by the search, or already stored on the challenge.
 * @returns one option per team, in the order they were given.
 * @throws Does not throw.
 */
function toOptions(teams: GiteaTeam[]): GiteaTeamOption[] {
    const organizations = new Set(
        teams
            .map(team => team.organization)
            .filter(organization => !!organization),
    )
    const includeOrganization = organizations.size > 1

    return teams.map(team => ({
        label: toOptionLabel(team, includeOrganization),
        team,
        value: String(team.id),
    }))
}

/**
 * Wraps a team search so keystrokes only reach the review API once typing settles.
 *
 * @param loader search to debounce.
 * @returns a loader that resolves with the results of the latest input value.
 * @throws Does not throw; the returned loader resolves empty on failure.
 */
function createDebouncedLoader(
    loader: (value: string) => Promise<GiteaTeamOption[]>,
): (value: string) => Promise<GiteaTeamOption[]> {
    let timeoutId: number | undefined

    return (value: string): Promise<GiteaTeamOption[]> => new Promise(resolve => {
        if (timeoutId !== undefined) {
            window.clearTimeout(timeoutId)
        }

        timeoutId = window.setTimeout(async () => {
            resolve(await loader(value))
        }, GITEA_TEAM_SEARCH_DEBOUNCE_TIME_MS)
    })
}

/**
 * Renders the editor for the Gitea teams challenge participants are synced with.
 *
 * @param props field state supplied by the challenge editor, including read-only disablement.
 * @returns A searchable multi-select bound to the editor's `giteaTeams` form value.
 * @remarks Teams are searched across the configured Gitea organizations and stored with
 * their id, so challenge metadata hydration and serialization keep the id the
 * review API syncs membership with.
 * @throws Does not throw.
 */
export const GiteaTeamsField: FC<GiteaTeamsFieldProps> = (
    props: GiteaTeamsFieldProps,
) => {
    const loadTeamOptions = useCallback(
        async (inputValue: string): Promise<GiteaTeamOption[]> => {
            const normalizedInputValue = inputValue.trim()

            if (normalizedInputValue.length < GITEA_TEAM_SEARCH_MIN_LENGTH) {
                return []
            }

            try {
                const teams = await searchGiteaTeams(normalizedInputValue)

                return toOptions(teams)
            } catch {
                return []
            }
        },
        [],
    )

    const debouncedLoadTeamOptions = useMemo(
        () => createDebouncedLoader(loadTeamOptions),
        [loadTeamOptions],
    )

    const mapFromFieldValue = useCallback(
        (value: unknown): FormSelectOption[] => toOptions(normalizeGiteaTeams(value)),
        [],
    )

    const mapToFieldValue = useCallback(
        (selected: FormSelectOption[] | unknown): GiteaTeam[] => normalizeGiteaTeams(
            Array.isArray(selected)
                ? selected.map(option => (option as GiteaTeamOption)?.team)
                : [],
        ),
        [],
    )

    return (
        <FormSelectField
            disabled={props.disabled}
            fromFieldValue={mapFromFieldValue}
            hint={GITEA_TEAMS_HINT}
            isAsync
            isMulti
            label='Gitea Teams'
            loadOptions={debouncedLoadTeamOptions}
            name='giteaTeams'
            placeholder='Search Gitea teams by name'
            toFieldValue={mapToFieldValue}
        />
    )
}

export default GiteaTeamsField
