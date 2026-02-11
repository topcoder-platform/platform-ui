import {
    xhrGetAsync,
    xhrPatchAsync,
} from '~/libs/core'

import {
    APPLICATIONS_API_URL,
    ENGAGEMENTS_ROOT_API_URL,
} from '../constants'
import {
    Application,
} from '../models'

export interface ApplicationFilters {
    page?: number
    perPage?: number
    status?: string
}

interface ApplicationResponse {
    data?: Application[]
    result?: Application[]
}

function normalizeError(error: unknown, fallbackMessage: string): Error {
    const typedError = error as {
        message?: string
        response?: {
            data?: {
                message?: string
            }
        }
    }

    const errorMessage = typedError?.response?.data?.message
        || typedError?.message
        || fallbackMessage

    return new Error(errorMessage)
}

function normalizeStatus(status: string): string {
    if (!status) {
        return ''
    }

    return status
        .trim()
        .toUpperCase()
}

function normalizeApplication(application: Partial<Application>): Application {
    return {
        availability: typeof application.availability === 'string'
            ? application.availability
            : '',
        coverLetter: typeof application.coverLetter === 'string'
            ? application.coverLetter
            : undefined,
        createdAt: typeof application.createdAt === 'string'
            ? application.createdAt
            : '',
        email: typeof application.email === 'string'
            ? application.email
            : '',
        engagementId: application.engagementId || '',
        handle: typeof application.handle === 'string'
            ? application.handle
            : '',
        id: application.id || '',
        name: typeof application.name === 'string'
            ? application.name
            : '',
        status: normalizeStatus(application.status || ''),
        updatedAt: typeof application.updatedAt === 'string'
            ? application.updatedAt
            : undefined,
        userId: application.userId || '',
        yearsOfExperience: Number(application.yearsOfExperience) || 0,
    }
}

function extractApplications(response: unknown): Application[] {
    if (Array.isArray(response)) {
        return response
            .map(application => normalizeApplication(application as Partial<Application>))
    }

    if (typeof response === 'object' && response) {
        const typedResponse = response as ApplicationResponse
        const data = Array.isArray(typedResponse.data)
            ? typedResponse.data
            : Array.isArray(typedResponse.result)
                ? typedResponse.result
                : []

        return data.map(application => normalizeApplication(application))
    }

    return []
}

function createQuery(filters: ApplicationFilters): string {
    const query = new URLSearchParams()

    if (filters.status && filters.status !== 'all') {
        query.set('status', normalizeStatus(filters.status))
    }

    if (filters.page) {
        query.set('page', String(filters.page))
    }

    if (filters.perPage) {
        query.set('perPage', String(filters.perPage))
    }

    return query.toString()
}

export async function fetchApplications(
    engagementId: number | string,
    filters: ApplicationFilters = {},
): Promise<Application[]> {
    const query = createQuery(filters)
    const url = query
        ? `${ENGAGEMENTS_ROOT_API_URL}/${engagementId}/applications?${query}`
        : `${ENGAGEMENTS_ROOT_API_URL}/${engagementId}/applications`

    try {
        const response = await xhrGetAsync<unknown>(url)

        return extractApplications(response)
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch applications')
    }
}

export async function fetchApplication(
    applicationId: number | string,
): Promise<Application> {
    try {
        const response = await xhrGetAsync<Application>(
            `${APPLICATIONS_API_URL}/${applicationId}`,
        )

        return normalizeApplication(response)
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch application details')
    }
}

export async function updateApplicationStatus(
    applicationId: number | string,
    status: string,
): Promise<Application> {
    try {
        const response = await xhrPatchAsync<{ status: string }, Application>(
            `${APPLICATIONS_API_URL}/${applicationId}/status`,
            {
                status: normalizeStatus(status),
            },
        )

        return normalizeApplication(response)
    } catch (error) {
        throw normalizeError(error, 'Failed to update application status')
    }
}

export interface AssignmentApprovalDetails {
    agreementRate: string
    endDate: string
    otherRemarks?: string
    startDate: string
}

export async function approveApplication(
    applicationId: number | string,
    assignmentDetails: AssignmentApprovalDetails,
): Promise<Application> {
    try {
        const response = await xhrPatchAsync<AssignmentApprovalDetails, Application>(
            `${APPLICATIONS_API_URL}/${applicationId}/approve`,
            assignmentDetails,
        )

        return normalizeApplication(response)
    } catch (error) {
        throw normalizeError(error, 'Failed to approve application')
    }
}
