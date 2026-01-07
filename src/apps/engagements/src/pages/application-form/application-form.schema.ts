import * as yup from 'yup'

export const applicationFormSchema = yup.object({
    coverLetter: yup
        .string()
        .max(5000, 'Cover letter must be 5000 characters or less')
        .optional(),
    resumeUrl: yup
        .string()
        .url('Must be a valid URL')
        .optional(),
    portfolioUrls: yup
        .array()
        .of(yup.string().url('Must be a valid URL'))
        .optional(),
    yearsOfExperience: yup
        .number()
        .min(0, 'Must be 0 or greater')
        .integer('Must be a whole number')
        .optional(),
    availability: yup
        .string()
        .max(500, 'Availability must be 500 characters or less')
        .optional(),
})
