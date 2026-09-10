import * as yup from 'yup'

import type { LeadIntakeFormData } from './lead-intake.types'

const requiredMessage = 'Field cannot be empty or contain only whitespace'

const skillSchema = yup.object({
    id: yup
        .string()
        .required(),
    name: yup
        .string()
        .required(),
})

export const leadIntakeSchema: yup.ObjectSchema<LeadIntakeFormData> = yup.object({
    accountName: yup
        .string()
        .trim()
        .required(requiredMessage)
        .max(255),
    additionalRequirements: yup
        .string()
        .max(5000)
        .default(''),
    billRateAmount: yup
        .string()
        .trim()
        .required(requiredMessage)
        .max(50),
    billRateCurrency: yup
        .string()
        .trim()
        .required(requiredMessage)
        .max(10),
    engagementDuration: yup
        .string()
        .trim()
        .required(requiredMessage)
        .max(100),
    engagementModel: yup
        .string()
        .oneOf(['TIME_AND_MATERIAL', 'FIXED_PRICE'])
        .required(requiredMessage),
    experienceLevel: yup
        .string()
        .oneOf(['JUNIOR', 'MID', 'SENIOR', 'LEAD_ARCHITECT'])
        .required(requiredMessage),
    industryDomain: yup
        .string()
        .max(255)
        .default(''),
    jobDescription: yup
        .string()
        .trim()
        .required(requiredMessage)
        .max(10000),
    minYearsExperience: yup
        .number()
        .min(0, 'Must be 0 or greater')
        .integer('Must be a whole number')
        .required(requiredMessage)
        .defined(),
    preferredStartDate: yup
        .string()
        .required(requiredMessage),
    priority: yup
        .string()
        .oneOf(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])
        .required(requiredMessage),
    remoteWorkAccepted: yup
        .string()
        .oneOf(['yes', 'no'])
        .required(requiredMessage),
    requiredSkills: yup
        .array()
        .of(skillSchema)
        .min(1, 'Please add at least one required skill')
        .required(requiredMessage),
    resourcesRequired: yup
        .number()
        .min(1, 'Must be at least 1')
        .integer('Must be a whole number')
        .required(requiredMessage)
        .defined(),
    roleTitle: yup
        .string()
        .trim()
        .required(requiredMessage)
        .max(255),
    smu: yup
        .string()
        .trim()
        .required(requiredMessage)
        .max(255),
    timeZoneRequirement: yup
        .string()
        .trim()
        .required(requiredMessage)
        .max(255),
    workEmail: yup
        .string()
        .trim()
        .email('Please enter a valid email address')
        .required(requiredMessage)
        .max(255),
    workingHoursPerDay: yup
        .number()
        .min(0.01, 'Must be greater than 0')
        .required(requiredMessage)
        .defined(),
    workLocationRestrictions: yup
        .string()
        .max(500)
        .default(''),
})
