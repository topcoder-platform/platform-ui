import { FC } from 'react'

import {
    FormRadioGroup,
    FormRadioOption,
} from '../../../../../lib/components/form'
import { ROUND_TYPES } from '../../../../../lib/constants/challenge-editor.constants'

const roundTypeOptions: FormRadioOption<string>[] = [
    {
        label: ROUND_TYPES.SINGLE_ROUND,
        value: ROUND_TYPES.SINGLE_ROUND,
    },
    {
        label: ROUND_TYPES.TWO_ROUNDS,
        value: ROUND_TYPES.TWO_ROUNDS,
    },
]

export const RoundTypeField: FC = () => (
    <FormRadioGroup
        label='Round Type'
        name='roundType'
        options={roundTypeOptions}
        required
    />
)

export default RoundTypeField
