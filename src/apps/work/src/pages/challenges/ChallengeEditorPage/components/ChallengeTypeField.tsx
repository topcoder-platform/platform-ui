import { FC, useMemo } from 'react'

import {
    FormSelectField,
    FormSelectOption,
} from '../../../../lib/components/form'
import {
    useFetchChallengeTypes,
    UseFetchChallengeTypesResult,
} from '../../../../lib/hooks'
import { Track as ChallengeTrack } from '../../../../lib/models'

import { buildChallengeTypeOptions } from './ChallengeTypeField.utils'

interface ChallengeTypeFieldProps {
    disabled?: boolean
    track?: ChallengeTrack
}

export const ChallengeTypeField: FC<ChallengeTypeFieldProps> = (
    props: ChallengeTypeFieldProps,
) => {
    const {
        challengeTypes,
        isLoading,
    }: UseFetchChallengeTypesResult = useFetchChallengeTypes()

    const options = useMemo<FormSelectOption[]>(
        () => buildChallengeTypeOptions(challengeTypes, props.track),
        [
            challengeTypes,
            props.track,
        ],
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
