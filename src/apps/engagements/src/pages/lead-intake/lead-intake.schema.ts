import * as yup from 'yup'

import { SMU_OPTIONS } from './lead-intake.constants'
import type { LeadIntakeFormData, WiproDirectLeadIntakeFormData } from './lead-intake.types'

const requiredMessage = 'Field cannot be empty or contain only whitespace'
const remoteWorkMessage = 'Please confirm that a fully remote engagement is acceptable'

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
    engagementDuration: yup
        .string()
        .trim()
        .required(requiredMessage)
        .max(100),
    jobDescription: yup
        .string()
        .trim()
        .required(requiredMessage)
        .max(10000),
    maximumCost: yup
        .string()
        .trim()
        .required(requiredMessage)
        .max(100),
    minYearsExperience: yup
        .number()
        .min(0, 'Must be 0 or greater')
        .integer('Must be a whole number')
        .required(requiredMessage)
        .defined(),
    preferredStartDate: yup
        .string()
        .required(requiredMessage),
    remoteWorkAccepted: yup
        .string()
        .oneOf(['yes'], remoteWorkMessage)
        .required(remoteWorkMessage),
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
        .oneOf(SMU_OPTIONS.map(option => option.value))
        .required(requiredMessage),
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

export const wiproDirectLeadIntakeSchema: yup.ObjectSchema<WiproDirectLeadIntakeFormData> = leadIntakeSchema
    .pick([
        'accountName',
        'engagementDuration',
        'jobDescription',
        'remoteWorkAccepted',
        'requiredSkills',
        'resourcesRequired',
        'smu',
        'timeZoneRequirement',
        'workEmail',
        'workingHoursPerDay',
        'workLocationRestrictions',
    ])
    .shape({
        preferredStartDate: yup
            .string()
            .default(''),
    })
