import { FC, useMemo } from 'react'

import {
    FormSelectField,
    FormSelectOption,
} from '../../../../lib/components/form'
import { DESIGN_WORK_TYPES } from '../../../../lib/constants/challenge-editor.constants'

interface DesignWorkTypeFieldProps {
    disabled?: boolean
}

export const DesignWorkTypeField: FC<DesignWorkTypeFieldProps> = (
    props: DesignWorkTypeFieldProps,
) => {
    const options = useMemo<FormSelectOption[]>(
        () => DESIGN_WORK_TYPES.map(workType => ({
            label: workType,
            value: workType,
        })),
        [],
    )

    return (
        <FormSelectField
            disabled={props.disabled}
            label='Work Type'
            name='workType'
            options={options}
            placeholder='Select work type'
            required
        />
    )
}

export default DesignWorkTypeField
