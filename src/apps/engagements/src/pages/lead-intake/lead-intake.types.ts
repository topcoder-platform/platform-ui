import type { SearchUserSkill } from '~/libs/core'

export interface LeadIntakeFormData {
    workEmail: string
    accountName: string
    smu: string
    engagementModel: string
    roleTitle: string
    jobDescription: string
    requiredSkills: SearchUserSkill[]
    experienceLevel: string
    minYearsExperience: number
    resourcesRequired: number
    preferredStartDate: string
    engagementDuration: string
    workingHoursPerDay: number
    timeZoneRequirement: string
    remoteWorkAccepted: string
    workLocationRestrictions: string
    billRateCurrency: string
    billRateAmount: string
}

export type LeadIntakeVariant = 'wiproConsumption' | 'wiproDirect'

export type WiproDirectLeadIntakeFormData = Pick<
    LeadIntakeFormData,
    | 'workEmail'
    | 'accountName'
    | 'smu'
    | 'jobDescription'
    | 'requiredSkills'
    | 'resourcesRequired'
    | 'preferredStartDate'
    | 'engagementDuration'
    | 'workingHoursPerDay'
    | 'timeZoneRequirement'
    | 'remoteWorkAccepted'
    | 'workLocationRestrictions'
>
