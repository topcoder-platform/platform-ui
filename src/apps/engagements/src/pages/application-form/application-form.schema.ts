import * as yup from 'yup'

import type { ApplicationFormData } from './application-form.types'

const requiredMessage = 'Field cannot be empty or contain only whitespace'

export const applicationFormSchema: yup.ObjectSchema<ApplicationFormData> = yup.object({
    address: yup
        .string()
        .optional(),
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
    cvFileUrl: yup
        .string()
        .url('Must be a valid URL')
        .optional(),
    email: yup
        .string()
        .optional(),
    expectedPayRate: yup
        .string()
        .trim()
        .required(requiredMessage)
        .max(100, 'Expected pay rate must be 100 characters or less')
        .defined(),
    mobileNumber: yup
        .string()
        .required('Mobile Number must be defined')
        .test(
            'not-whitespace',
            requiredMessage,
            value => (
                value === undefined
                || value === ''
                || (typeof value === 'string' && value.trim().length > 0)
            ),
        )
        .matches(
            /^[\d\s()+-]+$/,
            'Mobile number must contain only digits, spaces, hyphens, plus signs, and parentheses',
        )
        .max(20, 'Mobile number must be 20 characters or less')
        .required('Mobile Number must be defined'),
    name: yup
        .string()
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
        .test(
            'has-portfolio-url',
            'Add at least one portfolio URL',
            entries => (entries ?? []).some(entry => !!entry.value?.trim()),
        )
        .defined(),
    referralSource: yup
        .string()
        .max(500, 'Must be 500 characters or less')
        .optional(),
})
