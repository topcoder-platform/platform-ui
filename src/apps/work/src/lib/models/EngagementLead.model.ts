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

export enum LeadPriority {
    CRITICAL = 'CRITICAL',
    HIGH = 'HIGH',
    MEDIUM = 'MEDIUM',
    LOW = 'LOW',
}

export interface EngagementLead {
    id: string
    workEmail: string
    accountName: string
    smu: string
    engagementModel: EngagementModel | string
    roleTitle: string
    jobDescription: string
    requiredSkills: string[]
    experienceLevel: ExperienceLevel | string
    minYearsExperience: number
    industryDomain?: string | null
    resourcesRequired: number
    preferredStartDate: string
    engagementDuration: string
    workingHoursPerDay: number
    timeZoneRequirement: string
    remoteWorkAccepted: boolean
    workLocationRestrictions?: string | null
    billRateCurrency: string
    billRateAmount: string
    priority: LeadPriority | string
    additionalRequirements?: string | null
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
    page?: number
    perPage?: number
    priority?: LeadPriority | string
    roleTitle?: string
    smu?: string
    sortBy?: 'createdAt' | 'preferredStartDate' | 'priority'
    sortOrder?: 'asc' | 'desc'
    status?: EngagementLeadStatus | string
    statusGroup?: 'CONVERTED' | 'DECLINED' | 'NEW' | string
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
