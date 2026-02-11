export interface ChallengeFilters {
    name?: string
    type?: string
    status?: string | string[]
    projectId?: number | string
    startDateStart?: string
    startDateEnd?: string
    endDateStart?: string
    endDateEnd?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}
