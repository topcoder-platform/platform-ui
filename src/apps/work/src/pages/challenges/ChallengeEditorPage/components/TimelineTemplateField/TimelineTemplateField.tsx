import { FC, useMemo } from 'react'
import { useFormContext } from 'react-hook-form'

import {
    FormSelectField,
    FormSelectOption,
} from '../../../../../lib/components/form'
import { useFetchTimelineTemplates } from '../../../../../lib/hooks'

interface TimelineTemplateFieldProps {
    name: string
    required?: boolean
    disabled?: boolean
}

export const TimelineTemplateField: FC<TimelineTemplateFieldProps> = (
    props: TimelineTemplateFieldProps,
) => {
    const formContext = useFormContext()
    const trackId = formContext.watch('trackId') as string | undefined
    const typeId = formContext.watch('typeId') as string | undefined

    const timelineTemplatesResult = useFetchTimelineTemplates()
    const error = timelineTemplatesResult.error
    const isError = timelineTemplatesResult.isError
    const isLoading = timelineTemplatesResult.isLoading
    const timelineTemplates = timelineTemplatesResult.timelineTemplates

    const options = useMemo<FormSelectOption[]>(
        () => timelineTemplates
            .filter(template => template.isActive)
            .filter(template => template.trackId === trackId && template.typeId === typeId)
            .sort((templateA, templateB) => templateA.name.localeCompare(templateB.name))
            .map(template => ({
                label: template.name,
                value: template.id,
            })),
        [timelineTemplates, trackId, typeId],
    )

    return (
        <div>
            <FormSelectField
                disabled={props.disabled || isLoading || isError || !trackId || !typeId}
                hint={!trackId || !typeId
                    ? 'Select track and type first'
                    : undefined}
                label='Timeline Template'
                name={props.name}
                options={options}
                placeholder='Select timeline template'
                required={props.required}
            />

            {isError
                ? (
                    <p
                        aria-live='polite'
                        style={{
                            color: '#ef476f',
                            fontSize: '12px',
                            margin: '6px 0 0',
                        }}
                    >
                        {error?.message || 'Unable to load timeline templates'}
                    </p>
                )
                : undefined}
        </div>
    )
}

export default TimelineTemplateField
