import { FC, useMemo } from 'react'

import {
    FormSelectField,
    FormSelectOption,
} from '../../../../lib/components/form'
import {
    useFetchChallengeTypes,
    UseFetchChallengeTypesResult,
} from '../../../../lib/hooks'

import { buildChallengeTypeOptions } from './ChallengeTypeField.utils'

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
        () => buildChallengeTypeOptions(challengeTypes),
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
