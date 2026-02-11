import { FC, useMemo } from 'react'

import {
    ENGAGEMENT_STATUSES,
} from '../../../../lib/constants'
import {
    FormSelectField,
    FormSelectOption,
} from '../../../../lib/components/form'

export const EngagementStatusField: FC = () => {
    const options = useMemo<FormSelectOption[]>(() => ENGAGEMENT_STATUSES.map(status => ({
        label: status,
        value: status,
    })), [])

    return (
        <FormSelectField
            label='Status'
            name='status'
            options={options}
            placeholder='Select status'
            required
        />
    )
}

export default EngagementStatusField
