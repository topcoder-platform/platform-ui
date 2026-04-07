import { FC } from 'react'

import { FormCheckboxField } from '../../../../../lib/components/form'

interface FunChallengeFieldProps {
    disabled?: boolean
}

export const FunChallengeField: FC<FunChallengeFieldProps> = (props: FunChallengeFieldProps) => (
    <FormCheckboxField
        disabled={props.disabled}
        label='Fun Challenge'
        name='funChallenge'
    />
)

export default FunChallengeField
