import { FC } from 'react'

import {
    FormRadioGroup,
} from '../../../../lib/components/form'

const START_OPTIONS = [
    {
        label: 'Immediate',
        value: 'IMMEDIATE',
    },
    {
        label: 'In a few days',
        value: 'FEW_DAYS',
    },
    {
        label: 'In a few weeks',
        value: 'FEW_WEEKS',
    },
]

export const EngagementStartDateField: FC = () => (
    <FormRadioGroup
        label='Anticipated Start'
        name='anticipatedStart'
        options={START_OPTIONS}
        required
    />
)

export default EngagementStartDateField
