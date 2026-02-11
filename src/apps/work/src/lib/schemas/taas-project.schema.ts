import * as yup from 'yup'

export interface TaasProjectSchemaData {
    name: string
    jobs: Array<{
        title: string
        people: number
        role: {
            value: string
            label: string
        }
        duration: number
        workLoad: {
            value: string
            label: string
        }
        description: string
        skills: Array<{
            name: string
            skillId: string
        }>
    }>
}

function emptyStringToUndefined(value: unknown, originalValue: unknown): unknown {
    if (originalValue === '') {
        return undefined
    }

    return value
}

const selectOptionSchema = yup.object({
    label: yup.string()
        .trim()
        .required('Please select an option'),
    value: yup.string()
        .trim()
        .required('Please select an option'),
})

const skillSchema = yup.object({
    name: yup.string()
        .required('Skill name is required'),
    skillId: yup.string()
        .required('Skill id is required'),
})

const jobSchema = yup.object({
    description: yup.string()
        .trim()
        .required('Please enter a job description'),
    duration: yup.number()
        .transform(emptyStringToUndefined)
        .typeError('Please choose at least 4 weeks')
        .integer('Duration must be an integer')
        .min(4, 'Please choose at least 4 weeks')
        .required('Please choose at least 4 weeks'),
    people: yup.number()
        .transform(emptyStringToUndefined)
        .typeError('Please choose at least one person')
        .integer('Number of people must be an integer')
        .min(1, 'Please choose at least one person')
        .required('Please choose at least one person'),
    role: selectOptionSchema
        .required('Please choose role'),
    skills: yup.array()
        .of(skillSchema)
        .min(1, 'Please choose at least one skill')
        .required('Please choose at least one skill'),
    title: yup.string()
        .trim()
        .required('Please enter job title'),
    workLoad: selectOptionSchema
        .required('Please choose workload'),
})

export const taasProjectSchema: yup.ObjectSchema<TaasProjectSchemaData> = yup.object({
    jobs: yup.array()
        .of(jobSchema)
        .min(1, 'At least one job is required')
        .required('At least one job is required'),
    name: yup.string()
        .trim()
        .required('Please enter project title'),
})
    .required()
