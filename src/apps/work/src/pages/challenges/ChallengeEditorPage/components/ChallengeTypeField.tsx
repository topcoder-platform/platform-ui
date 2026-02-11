import { FC, useMemo } from 'react'

import {
    FormSelectField,
    FormSelectOption,
} from '../../../../lib/components/form'
import {
    useFetchChallengeTypes,
    UseFetchChallengeTypesResult,
} from '../../../../lib/hooks'

interface ChallengeTypeFieldProps {
    disabled?: boolean
}

export const ChallengeTypeField: FC<ChallengeTypeFieldProps> = (
    props: ChallengeTypeFieldProps,
) => {
    const {
        challengeTypes,
        isLoading,
    }: UseFetchChallengeTypesResult = useFetchChallengeTypes()

    const options = useMemo<FormSelectOption[]>(
        () => challengeTypes
            .filter(type => type.isActive)
            .sort((typeA, typeB) => typeA.name.localeCompare(typeB.name))
            .map(type => ({
                label: type.name,
                value: type.id,
            })),
        [challengeTypes],
    )

    return (
        <FormSelectField
            disabled={props.disabled || isLoading}
            label='Challenge Type'
            name='typeId'
            options={options}
            placeholder='Select type'
            required
        />
    )
}

export default ChallengeTypeField
