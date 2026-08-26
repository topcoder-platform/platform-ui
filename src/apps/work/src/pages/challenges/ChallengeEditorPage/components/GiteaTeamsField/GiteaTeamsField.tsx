import {
    FC,
    useCallback,
} from 'react'

import {
    FormSelectField,
    FormSelectOption,
} from '../../../../../lib/components/form'
import { normalizeGiteaTeams } from '../../../../../lib/utils/metadata.utils'

const GITEA_TEAMS_HINT = 'Challenge participants will be automatically added to these Gitea teams'
    + ' upon registration and removed if they unregister.'

interface GiteaTeamsFieldProps {
    disabled?: boolean
}

/**
 * Renders the editor for the Gitea team ids challenge participants are synced with.
 *
 * @param props field state supplied by the challenge editor, including read-only disablement.
 * @returns A creatable multi-select bound to the editor's `giteaTeams` form value.
 * @remarks Values are de-duplicated on both read and write; challenge metadata
 * hydration and serialization are handled by the editor mapping utils.
 * @throws Does not throw.
 */
export const GiteaTeamsField: FC<GiteaTeamsFieldProps> = (
    props: GiteaTeamsFieldProps,
) => {
    const mapFromFieldValue = useCallback(
        (value: unknown): FormSelectOption[] => normalizeGiteaTeams(value)
            .map(team => ({
                label: team,
                value: team,
            })),
        [],
    )

    const mapToFieldValue = useCallback(
        (selected: FormSelectOption[] | unknown): string[] => normalizeGiteaTeams(
            Array.isArray(selected)
                ? selected.map(option => (
                    typeof option === 'object' && option && 'value' in option
                        ? (option as { value?: unknown }).value
                        : option
                ))
                : selected,
        ),
        [],
    )

    return (
        <FormSelectField
            disabled={props.disabled}
            fromFieldValue={mapFromFieldValue}
            hint={GITEA_TEAMS_HINT}
            isCreatable
            isMulti
            label='Gitea Teams'
            name='giteaTeams'
            options={[]}
            placeholder='Add Gitea team ids'
            toFieldValue={mapToFieldValue}
        />
    )
}

export default GiteaTeamsField
