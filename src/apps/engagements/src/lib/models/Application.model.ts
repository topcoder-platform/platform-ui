import { Engagement } from './Engagement.model'

export enum ApplicationStatus {
    SUBMITTED = 'submitted',
    UNDER_REVIEW = 'under_review',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
}

export interface Application {
    id: string
    engagementId: string
    userId: number
    userHandle: string
    email: string
    name: string
    address?: string
    mobileNumber?: string
    coverLetter: string
    resumeUrl?: string
    portfolioLinks?: string[]
    yearsOfExperience?: number
    availability: string
    status: ApplicationStatus
    createdAt: string
    updatedAt: string
    engagement?: Engagement
}

export interface ApplicationListResponse {
    data: Application[]
    total: number
    page: number
    perPage: number
    totalPages: number
}

export interface CreateApplicationRequest {
    coverLetter: string
    resumeUrl?: string
    portfolioLinks?: string[]
    yearsOfExperience?: number
    availability: string
    mobileNumber?: string
}
