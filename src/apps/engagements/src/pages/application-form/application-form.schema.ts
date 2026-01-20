import * as yup from 'yup'

import type { ApplicationFormData } from './application-form.types'

const requiredMessage = 'Field cannot be empty or contain only whitespace'

export const applicationFormSchema: yup.ObjectSchema<ApplicationFormData> = yup.object({
    availability: yup
        .string()
        .max(500, 'Availability must be 500 characters or less')
        .test(
            'not-whitespace',
            requiredMessage,
            value => (
                value === undefined
                || value === ''
                || (typeof value === 'string' && value.trim().length > 0)
            ),
        )
        .optional(),
    coverLetter: yup
        .string()
        .trim()
        .required(requiredMessage)
        .max(5000, 'Cover letter must be 5000 characters or less')
        .defined(),
    mobileNumber: yup
        .string()
        .matches(
            /^[\d\s()+-]+$/,
            'Mobile number must contain only digits, spaces, hyphens, plus signs, and parentheses',
        )
        .max(20, 'Mobile number must be 20 characters or less')
        .optional(),
    portfolioUrls: yup
        .array()
        .of(
            yup.object({
                value: yup
                    .string()
                    .url('Must be a valid URL')
                    .optional(),
            })
                .defined(),
        )
        .default([])
        .defined(),
    resumeUrl: yup
        .string()
        .url('Must be a valid URL')
        .optional(),
    yearsOfExperience: yup
        .number()
        .min(0, 'Must be 0 or greater')
        .integer('Must be a whole number')
        .optional(),
})
