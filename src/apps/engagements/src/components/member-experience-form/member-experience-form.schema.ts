import * as yup from 'yup'

export const memberExperienceFormSchema = yup.object({
    experienceText: yup
        .string()
        .trim()
        .required('Experience is required')
        .min(10, 'Experience must be at least 10 characters')
        .max(10000, 'Experience must be 10000 characters or less'),
})
