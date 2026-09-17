import { FC } from 'react'
import { useFormContext } from 'react-hook-form'

import { SMU_VALUES } from '../../constants/showcase.constants'

import { FormSelectField } from './FormSelectField'
import { FormTextField } from './FormTextField'

interface ProjectMetadataFieldsProps {
    className?: string
    required?: boolean
}

/**
 * Renders the shared Customer, SMU and Deal Close Date fields in both project forms.
 * @param props Optional field styling and whether showcase metadata is required.
 * @returns Fields bound to the surrounding React Hook Form, including custom SMU input.
 * @throws Requires a parent FormProvider, like the other work form controls.
 */
export const ProjectMetadataFields: FC<ProjectMetadataFieldsProps> = props => {
    const formContext = useFormContext()
    const smu = formContext.watch('smu')

    return (
        <>
            <FormTextField
                className={props.className}
                label='Customer'
                name='customer'
                maxLength={255}
                required={props.required}
            />
            <FormSelectField
                className={props.className}
                label='SMU'
                name='smu'
                options={SMU_VALUES.map(value => ({ label: value, value }))}
                isClearable={!props.required}
                required={props.required}
            />
            {smu === 'Others' && (
                <FormTextField
                    className={props.className}
                    label='Other SMU'
                    name='smuOther'
                    maxLength={255}
                    required
                />
            )}
            <FormTextField
                className={props.className}
                label='Deal Close Date'
                name='dealCloseDate'
                type='date'
                required={props.required}
            />
        </>
    )
}
