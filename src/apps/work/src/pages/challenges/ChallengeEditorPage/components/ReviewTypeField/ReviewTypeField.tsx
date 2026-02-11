import { FC } from 'react'

import {
    FormSelectField,
    FormSelectOption,
} from '../../../../../lib/components/form'
import { REVIEW_TYPES } from '../../../../../lib/constants/challenge-editor.constants'

const reviewTypeOptions: FormSelectOption[] = [
    {
        label: 'Internal',
        value: REVIEW_TYPES.INTERNAL,
    },
    {
        label: 'Community',
        value: REVIEW_TYPES.COMMUNITY,
    },
    {
        label: 'System',
        value: REVIEW_TYPES.SYSTEM,
    },
    {
        label: 'Provisional',
        value: REVIEW_TYPES.PROVISIONAL,
    },
    {
        label: 'Example',
        value: REVIEW_TYPES.EXAMPLE,
    },
]

export const ReviewTypeField: FC = () => (
    <FormSelectField
        label='Review Type'
        name='legacy.reviewType'
        options={reviewTypeOptions}
        placeholder='Select review type'
        required
    />
)

export default ReviewTypeField
