import {
    xhrGetAsync,
    xhrGetPaginatedAsync,
    xhrPatchAsync,
    xhrPostAsync,
} from '~/libs/core'
import { EnvironmentConfig } from '~/config'

import {
    PROJECT_STATUS,
    PROJECT_TYPE_TAAS,
    TAAS_PAGE_SIZE,
} from '../constants'
import {
    PaginationModel,
    Project,
    ProjectStatusValue,
    TaasJob,
    TaasSkill,
} from '../models'

export interface FetchTaasProjectsParams {
    keyword?: string
    memberOnly?: boolean
    page?: number
    perPage?: number
    status?: ProjectStatusValue | ProjectStatusValue[]
}

export interface FetchTaasProjectsResponse {
    projects: Project[]
    metadata: PaginationModel
}

export interface SaveTaasProjectPayload {
    name: string
    jobs: TaasJob[]
}

const PROJECTS_API_URL = `${EnvironmentConfig.API.V5}/projects`
const TAAS_LIST_FIELDS: string[] = [
    'id',
    'name',
    'status',
    'type',
    'createdAt',
    'updatedAt',
]

function normalizeOptionalString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
        return undefined
    }

    const trimmedValue = value.trim()

    return trimmedValue || undefined
}

function normalizeId(value: unknown): string {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value)
    }

    if (typeof value === 'string') {
        return value.trim()
    }

    return ''
}

function normalizeSkill(skill: unknown): TaasSkill | undefined {
    if (typeof skill !== 'object' || !skill) {
        return undefined
    }

    const typedSkill = skill as {
        id?: unknown
        name?: unknown
        skillId?: unknown
    }

    const skillId = normalizeOptionalString(typedSkill.skillId)
        || normalizeOptionalString(typedSkill.id)
    const name = normalizeOptionalString(typedSkill.name)

    if (!skillId || !name) {
        return undefined
    }

    return {
        name,
        skillId,
    }
}

interface RawTaasOption {
    label?: unknown
    title?: unknown
    value?: unknown
}

interface RawTaasJob {
    description?: unknown
    duration?: unknown
    jobId?: unknown
    people?: unknown
    role?: RawTaasOption
    skills?: unknown
    title?: unknown
    workLoad?: RawTaasOption
}

function asRawTaasJob(job: unknown): RawTaasJob | undefined {
    if (typeof job !== 'object' || !job) {
        return undefined
    }

    return job as RawTaasJob
}

function normalizeTaasOption(option: RawTaasOption | undefined): {
    title: string
    value: string
} | undefined {
    const value = normalizeOptionalString(option?.value)
    const title = normalizeOptionalString(option?.title)
        || normalizeOptionalString(option?.label)

    if (!value || !title) {
        return undefined
    }

    return {
        title,
        value,
    }
}

function normalizeNumericString(value: unknown): string {
    if (value === undefined || value === null) {
        return '0'
    }

    return String(value)
}

function normalizeTaasJob(job: unknown): TaasJob | undefined {
    const typedJob = asRawTaasJob(job)

    if (!typedJob) {
        return undefined
    }

    const title = normalizeOptionalString(typedJob.title)
    const role = normalizeTaasOption(typedJob.role)
    const workLoad = normalizeTaasOption(typedJob.workLoad)

    if (!title || !role || !workLoad) {
        return undefined
    }

    const people = normalizeNumericString(typedJob.people)
    const duration = normalizeNumericString(typedJob.duration)
    const description = normalizeOptionalString(typedJob.description) || ''
    const skills = Array.isArray(typedJob.skills)
        ? typedJob.skills
            .map(skill => normalizeSkill(skill))
            .filter((skill): skill is TaasSkill => !!skill)
        : []

    return {
        description,
        duration,
        jobId: typedJob.jobId === undefined || typedJob.jobId === null
            ? undefined
            : String(typedJob.jobId),
        people,
        role,
        skills,
        title,
        workLoad,
    }
}

function asPlainObject(value: unknown): Record<string, unknown> | undefined {
    if (typeof value !== 'object' || !value || Array.isArray(value)) {
        return undefined
    }

    return value as Record<string, unknown>
}

function normalizeProject(project: Partial<Project>): Project | undefined {
    const id = normalizeId(project.id)
    const name = normalizeOptionalString(project.name)

    if (!id || !name) {
        return undefined
    }

    const details = asPlainObject(project.details)
    const taasDefinition = asPlainObject(details?.taasDefinition)
    const rawTaasJobs = taasDefinition?.taasJobs

    const taasJobs = Array.isArray(rawTaasJobs)
        ? rawTaasJobs
            .map(job => normalizeTaasJob(job))
            .filter((job): job is TaasJob => !!job)
        : undefined

    return {
        ...project,
        details: taasJobs
            ? {
                ...(details || {}),
                taasDefinition: {
                    ...(taasDefinition || {}),
                    taasJobs,
                },
            } as Project['details']
            : project.details,
        id,
        name,
        status: (project.status || PROJECT_STATUS.DRAFT) as ProjectStatusValue,
        type: normalizeOptionalString(project.type),
    }
}

function appendArrayFilter(
    query: URLSearchParams,
    parameter: string,
    values: string[],
): void {
    values
        .filter(Boolean)
        .forEach(value => {
            query.append(`${parameter}[$in]`, value)
        })
}

function buildFetchTaasProjectsUrl(
    {
        keyword,
        memberOnly,
        page = 1,
        perPage = TAAS_PAGE_SIZE,
        status,
    }: FetchTaasProjectsParams = {},
): string {
    const query = new URLSearchParams({
        fields: TAAS_LIST_FIELDS.join(','),
        page: String(page),
        perPage: String(perPage),
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        type: PROJECT_TYPE_TAAS,
    })

    if (keyword?.trim()) {
        query.set('keyword', keyword.trim())
    }

    if (memberOnly) {
        query.set('memberOnly', 'true')
    }

    if (status) {
        if (Array.isArray(status)) {
            appendArrayFilter(query, 'status', status)
        } else {
            query.set('status', status)
        }
    }

    return `${PROJECTS_API_URL}?${query.toString()}`
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

function serializeSkill(skill: TaasSkill): TaasSkill {
    return {
        name: skill.name.trim(),
        skillId: skill.skillId.trim(),
    }
}

function serializeJob(job: TaasJob): TaasJob {
    return {
        description: job.description,
        duration: String(job.duration),
        jobId: job.jobId,
        people: String(job.people),
        role: {
            title: job.role.title.trim(),
            value: job.role.value.trim(),
        },
        skills: job.skills.map(skill => serializeSkill(skill)),
        title: job.title.trim(),
        workLoad: {
            title: job.workLoad.title.trim(),
            value: job.workLoad.value.trim(),
        },
    }
}

/**
 * Fetch paginated TaaS projects.
 */
export async function fetchTaasProjects(
    params: FetchTaasProjectsParams = {},
): Promise<FetchTaasProjectsResponse> {
    const page = params.page || 1
    const perPage = params.perPage || TAAS_PAGE_SIZE

    try {
        const response = await xhrGetPaginatedAsync<Partial<Project>[]>(
            buildFetchTaasProjectsUrl(params),
        )

        return {
            metadata: {
                page: response.page || page,
                perPage: response.perPage || perPage,
                total: response.total || 0,
                totalPages: response.totalPages || 0,
            },
            projects: (response.data || [])
                .map(project => normalizeProject(project))
                .filter((project): project is Project => !!project),
        }
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch TaaS projects')
    }
}

/**
 * Fetch TaaS project details by project id.
 */
export async function fetchTaasProjectById(projectId: string): Promise<Project> {
    try {
        const response = await xhrGetAsync<Partial<Project>>(
            `${PROJECTS_API_URL}/${encodeURIComponent(projectId)}`,
        )

        const project = normalizeProject(response)

        if (!project) {
            throw new Error('TaaS project details are missing required fields')
        }

        return project
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch TaaS project')
    }
}

/**
 * Create a TaaS project.
 */
export async function createTaasProject(payload: SaveTaasProjectPayload): Promise<Project> {
    try {
        const createPayload = {
            attachments: [],
            details: {
                intakePurpose: 'internal-project',
                taasDefinition: {
                    hiringManager: '',
                    kickOffTime: '',
                    oppurtunityDetails: {
                        customerName: '',
                        requestedStartDate: '',
                        staffingModel: '',
                        talentLocation: '',
                        workingTimezone: '',
                    },
                    otherRequirementBrief: '',
                    otherRequirements: [],
                    taasJobs: payload.jobs.map(job => serializeJob(job)),
                },
                utm: {
                    code: '',
                },
            },
            estimation: [],
            name: payload.name.trim(),
            templateId: 250,
            type: PROJECT_TYPE_TAAS,
            version: 'v4',
        }

        const response = await xhrPostAsync<typeof createPayload, Partial<Project>>(
            PROJECTS_API_URL,
            createPayload,
        )

        const project = normalizeProject(response)

        if (!project) {
            throw new Error('Created TaaS project has invalid data')
        }

        return project
    } catch (error) {
        throw normalizeError(error, 'Failed to create TaaS project')
    }
}

/**
 * Update an existing TaaS project.
 */
export async function updateTaasProject(
    projectId: string,
    payload: SaveTaasProjectPayload,
): Promise<Project> {
    try {
        const updatePayload = {
            details: {
                taasDefinition: {
                    taasJobs: payload.jobs.map(job => serializeJob(job)),
                },
            },
            name: payload.name.trim(),
        }

        const response = await xhrPatchAsync<typeof updatePayload, Partial<Project>>(
            `${PROJECTS_API_URL}/${encodeURIComponent(projectId)}`,
            updatePayload,
        )

        const project = normalizeProject(response)

        if (!project) {
            throw new Error('Updated TaaS project has invalid data')
        }

        return project
    } catch (error) {
        throw normalizeError(error, 'Failed to update TaaS project')
    }
}
