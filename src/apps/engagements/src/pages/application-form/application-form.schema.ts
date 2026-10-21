import * as yup from 'yup'

import type { ApplicationFormData, YesNoAnswer } from './application-form.types'
import { REFERRAL_SOURCE_OPTIONS, REFERRED_BY_OPTION } from './application-form.constants'

const requiredMessage = 'Field cannot be empty or contain only whitespace'
const selectOptionMessage = 'Please select an option'
const yesNoAnswers: YesNoAnswer[] = ['yes', 'no']

export const applicationFormSchema: yup.ObjectSchema<ApplicationFormData> = yup.object({
    address: yup
        .string()
        .optional(),
    availableFullTime: yup
        .mixed<YesNoAnswer>()
        .oneOf(yesNoAnswers, selectOptionMessage)
        .required(selectOptionMessage),
    availableWithinWeek: yup
        .mixed<YesNoAnswer>()
        .oneOf(yesNoAnswers, selectOptionMessage)
        .required(selectOptionMessage),
    cvFileUrl: yup
        .string()
        .url('Must be a valid URL')
        .required('Please upload your CV'),
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
    referralSource: yup
        .string()
        .oneOf([...REFERRAL_SOURCE_OPTIONS, ''], selectOptionMessage)
        .optional(),
    referrerHandle: yup
        .string()
        .max(100, 'Must be 100 characters or less')
        .when('referralSource', {
            is: REFERRED_BY_OPTION,
            otherwise: schema => schema.optional(),
            then: schema => schema
                .trim()
                .required('Please enter the handle of the member who referred you'),
        }),
})
