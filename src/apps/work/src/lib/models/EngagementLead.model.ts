import type { Skill } from './Skill.model'

export enum EngagementLeadStatus {
    SUBMITTED = 'SUBMITTED',
    UNDER_REVIEW = 'UNDER_REVIEW',
    QUALIFIED = 'QUALIFIED',
    CONVERTED = 'CONVERTED',
    REJECTED = 'REJECTED',
}

export enum EngagementModel {
    TIME_AND_MATERIAL = 'TIME_AND_MATERIAL',
    FIXED_PRICE = 'FIXED_PRICE',
}

export enum ExperienceLevel {
    JUNIOR = 'JUNIOR',
    MID = 'MID',
    SENIOR = 'SENIOR',
    LEAD_ARCHITECT = 'LEAD_ARCHITECT',
}

export enum EngagementLeadStatusGroup {
    NEW = 'NEW',
    IN_PROGRESS = 'IN_PROGRESS',
    CONVERTED = 'CONVERTED',
    DECLINED = 'DECLINED',
}

export enum EngagementLeadType {
    WIPRO_CONSUMPTION = 'WIPRO_CONSUMPTION',
    WIPRO_DIRECT = 'WIPRO_DIRECT',
}

export enum LeadPriority {
    CRITICAL = 'CRITICAL',
    HIGH = 'HIGH',
    MEDIUM = 'MEDIUM',
    LOW = 'LOW',
}

export interface EngagementLead {
    id: string
    leadType: EngagementLeadType | string
    workEmail: string
    accountName: string
    smu: string
    engagementModel?: EngagementModel | string | null
    roleTitle?: string | null
    jobDescription: string
    requiredSkills: string[]
    experienceLevel?: ExperienceLevel | string | null
    minYearsExperience?: number | null
    industryDomain?: string | null
    resourcesRequired: number
    preferredStartDate?: string | null
    engagementDuration: string
    workingHoursPerDay: number
    timeZoneRequirement: string
    remoteWorkAccepted: boolean
    workLocationRestrictions?: string | null
    billRateCurrency?: string | null
    billRateAmount?: string | null
    priority?: LeadPriority | string | null
    additionalRequirements?: string | null
    notes?: string | null
    notesUpdatedAt?: string | null
    notesUpdatedBy?: string | null
    status: EngagementLeadStatus | string
    convertedEngagementId?: string | null
    createdAt: string
    updatedAt: string
}

export interface EngagementLeadPrefill {
    account: string
    smu: string
    spoc: string
    title: string
    description: string
    requiredSkillNames: string[]
    // Standardized skills matched to `requiredSkillNames`; older API versions leave both unset.
    requiredSkills?: Skill[]
    unresolvedSkillNames?: string[]
    roleLevel?: string | null
    requiredMemberCount?: number | null
    durationStartDate?: string | null
    durationMonths?: number | null
    compensationRange?: string | null
    timeZones: string[]
    countries: string[]
    receivedDateFromAccount?: string | null
    additionalRequirements?: string | null
}

export interface EngagementLeadFilters {
    accountName?: string
    engagementModel?: EngagementModel | string
    experienceLevel?: ExperienceLevel | string
    leadType?: EngagementLeadType | string
    page?: number
    perPage?: number
    priority?: LeadPriority | string
    roleTitle?: string
    smu?: string
    sortBy?: 'createdAt' | 'preferredStartDate' | 'priority'
    sortOrder?: 'asc' | 'desc'
    status?: EngagementLeadStatus | string
    statusGroup?: EngagementLeadStatusGroup | string
}

export interface EngagementLeadListResponse {
    data: EngagementLead[]
    meta: {
        page: number
        perPage: number
        totalCount: number
        totalPages: number
    }
}
