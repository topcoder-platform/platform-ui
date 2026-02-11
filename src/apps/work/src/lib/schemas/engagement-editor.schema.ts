import * as yup from 'yup'

export interface EngagementEditorSchemaData {
    anticipatedStart: string
    assignedMemberHandles?: string[]
    countries: string[]
    description: string
    durationWeeks: number
    isPrivate: boolean
    requiredMemberCount?: number
    skills: unknown[]
    status: string
    timezones: string[]
    title: string
}

export const engagementEditorSchema: yup.ObjectSchema<EngagementEditorSchemaData> = yup.object({
    anticipatedStart: yup
        .string()
        .required('Anticipated start is required'),
    assignedMemberHandles: yup
        .array()
        .of(yup.string()
            .required())
        .when('isPrivate', {
            is: true,
            otherwise: schema => schema.optional(),
            then: schema => schema.min(1, 'At least one member required for private engagements'),
        }),
    countries: yup
        .array()
        .of(yup.string()
            .required())
        .min(1, 'Select at least one country')
        .required('Select at least one country'),
    description: yup
        .string()
        .required('Description is required'),
    durationWeeks: yup
        .number()
        .typeError('Duration is required')
        .required('Duration is required')
        .integer('Duration must be a whole number')
        .min(4, 'Duration must be at least 4 weeks'),
    isPrivate: yup
        .boolean()
        .required(),
    requiredMemberCount: yup
        .number()
        .when('isPrivate', {
            is: true,
            otherwise: schema => schema.optional(),
            then: schema => schema
                .typeError('Required members must be a number')
                .required('Required members is required')
                .integer('Required members must be a whole number')
                .min(1, 'Required members must be at least 1'),
        }),
    skills: yup
        .array()
        .min(1, 'Select at least one skill')
        .required('Select at least one skill'),
    status: yup
        .string()
        .required('Status is required'),
    timezones: yup
        .array()
        .of(yup.string()
            .required())
        .min(1, 'Select at least one timezone')
        .required('Select at least one timezone'),
    title: yup
        .string()
        .required('Title is required'),
})
    .required()
