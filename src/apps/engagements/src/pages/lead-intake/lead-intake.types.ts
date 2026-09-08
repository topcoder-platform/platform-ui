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
    industryDomain: string
    resourcesRequired: number
    preferredStartDate: string
    engagementDuration: string
    workingHoursPerDay: number
    timeZoneRequirement: string
    remoteWorkAccepted: string
    workLocationRestrictions: string
    billRateCurrency: string
    billRateAmount: string
    priority: string
    additionalRequirements: string
}
