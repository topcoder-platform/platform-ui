import {
    xhrDeleteAsync,
    xhrGetAsync,
    xhrGetPaginatedAsync,
    xhrPatchAsync,
    xhrPostAsync,
} from '~/libs/core'

import {
    ATTACHMENT_TYPE_FILE,
    FILE_PICKER_SUBMISSION_CONTAINER_NAME,
    GENERIC_PROJECT_MILESTONE_PRODUCT_NAME,
    GENERIC_PROJECT_MILESTONE_PRODUCT_TYPE,
    MEMBER_API_URL,
    PHASE_PRODUCT_CHALLENGE_ID_FIELD,
    PHASE_PRODUCT_TEMPLATE_ID,
    PROJECTS_API_URL,
    PROJECTS_PAGE_SIZE,
    PROJECT_STATUS,
} from '../constants'
import {
    CreateProjectPayload,
    PaginationModel,
    Project,
    ProjectAttachment,
    ProjectAttachmentPayload,
    ProjectInvite,
    ProjectMember,
    ProjectPhase,
    ProjectPhaseProduct,
    ProjectStatusValue,
    ProjectType,
    UpdateProjectPayload,
} from '../models'

import {
    createProjectMemberInvite,
} from './project-member-invites.service'
import { searchProfilesByUserIds } from './users.service'

export type ProjectSummary = Pick<Project,
    | 'createdAt'
    | 'id'
    | 'invites'
    | 'isInvited'
    | 'lastActivityAt'
    | 'name'
    | 'status'
    | 'type'
    | 'updatedAt'
>

export interface InviteMember {
    handle?: string
    userId: number
    [key: string]: unknown
}

interface FetchProjectsParams {
    memberOnly?: boolean
}

export interface FetchProjectsListParams {
    keyword?: string
    status?: ProjectStatusValue | ProjectStatusValue[]
    memberOnly?: boolean
    page?: number
    perPage?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

export interface FetchProjectsListResponse {
    projects: ProjectSummary[]
    metadata: PaginationModel
}

const PROJECT_TYPES_API_URL = `${PROJECTS_API_URL}/metadata/projectTypes`
const PROJECTS_PER_PAGE = 100
const PROJECTS_LIST_FIELDS: string[] = [
    'id',
    'name',
    'status',
    'type',
    'lastActivityAt',
    'createdAt',
    'updatedAt',
    'invites',
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

function normalizeOptionalId(value: unknown): string | undefined {
    if (value === undefined || value === null) {
        return undefined
    }

    const normalizedValue = normalizeId(value)

    return normalizedValue || undefined
}

function normalizeProjectMember(member: unknown): ProjectMember | undefined {
    if (typeof member !== 'object' || !member) {
        return undefined
    }

    const typedMember = member as Partial<ProjectMember>
    const id = typedMember.id !== undefined && typedMember.id !== null
        ? String(typedMember.id)
        : undefined
    const userId = typedMember.userId !== undefined && typedMember.userId !== null
        && Number.isFinite(Number(typedMember.userId))
        ? Number(typedMember.userId)
        : undefined
    const email = normalizeOptionalString((typedMember as {
        email?: unknown
    }).email)
    const handle = normalizeOptionalString(typedMember.handle)
    const role = normalizeOptionalString(typedMember.role)

    if (!id && userId === undefined && !handle && !role && !email) {
        return undefined
    }

    return {
        email,
        handle,
        id,
        role,
        userId,
    }
}

function normalizeProjectInvite(invite: unknown): ProjectInvite | undefined {
    if (typeof invite !== 'object' || !invite) {
        return undefined
    }

    const typedInvite = invite as Partial<ProjectInvite>
    const id = typedInvite.id !== undefined && typedInvite.id !== null
        ? String(typedInvite.id)
        : undefined
    const email = normalizeOptionalString(typedInvite.email)
    const userId = typedInvite.userId !== undefined && typedInvite.userId !== null
        && Number.isFinite(Number(typedInvite.userId))
        ? Number(typedInvite.userId)
        : undefined
    const role = normalizeOptionalString(typedInvite.role)
    const status = normalizeOptionalString(typedInvite.status)

    if (!id && !email && userId === undefined && !role && !status) {
        return undefined
    }

    return {
        email,
        id,
        role,
        status,
        userId,
    }
}

function normalizeProjectTermsOrGroups(values: unknown): string[] | undefined {
    if (!Array.isArray(values)) {
        return undefined
    }

    return values
        .map(value => {
            if (typeof value === 'number' && Number.isFinite(value)) {
                return String(value)
            }

            if (typeof value === 'string') {
                const trimmedValue = value.trim()

                return trimmedValue || undefined
            }

            if (typeof value === 'object' && value && 'id' in value) {
                return normalizeId((value as {
                    id?: unknown
                }).id)
            }

            return undefined
        })
        .filter((value): value is string => !!value)
}

function normalizeProject(project: Partial<Project>): Project {
    const id = normalizeId(project.id)
    const name = normalizeOptionalString(project.name)

    if (!id || !name) {
        throw new Error('Project details are missing required fields')
    }

    const members = Array.isArray(project.members)
        ? project.members
            .map(member => normalizeProjectMember(member))
            .filter((member): member is ProjectMember => !!member)
        : []
    const invites = Array.isArray(project.invites)
        ? project.invites
            .map(invite => normalizeProjectInvite(invite))
            .filter((invite): invite is ProjectInvite => !!invite)
        : []

    return {
        billingAccountId: normalizeOptionalId(project.billingAccountId),
        cancelReason: normalizeOptionalString(project.cancelReason),
        createdAt: normalizeOptionalString(project.createdAt),
        description: typeof project.description === 'string'
            ? project.description
            : undefined,
        groups: normalizeProjectTermsOrGroups(project.groups),
        id,
        invites,
        isInvited: project.isInvited ?? invites.length > 0,
        lastActivityAt: normalizeOptionalString(project.lastActivityAt),
        members,
        name,
        status: (project.status || PROJECT_STATUS.DRAFT) as ProjectStatusValue,
        terms: normalizeProjectTermsOrGroups(project.terms),
        type: normalizeOptionalString(project.type),
        updatedAt: normalizeOptionalString(project.updatedAt),
    }
}

function normalizeProjectType(projectType: Partial<ProjectType>): ProjectType | undefined {
    const key = normalizeOptionalString(projectType.key)
    const displayName = normalizeOptionalString(projectType.displayName)

    if (!key || !displayName) {
        return undefined
    }

    return {
        description: typeof projectType.description === 'string'
            ? projectType.description
            : undefined,
        displayName,
        key,
    }
}

function normalizeProjectPhaseProduct(product: unknown): ProjectPhaseProduct | undefined {
    if (typeof product !== 'object' || !product) {
        return undefined
    }

    const typedProduct = product as Partial<ProjectPhaseProduct>
    const id = typedProduct.id !== undefined && typedProduct.id !== null
        ? String(typedProduct.id)
        : undefined
    const name = normalizeOptionalString(typedProduct.name)

    if (!id && !name) {
        return undefined
    }

    return {
        details: typeof typedProduct.details === 'object'
            ? typedProduct.details
            : undefined,
        id,
        name,
        status: normalizeOptionalString(typedProduct.status),
        templateId: typedProduct.templateId !== undefined && typedProduct.templateId !== null
            ? String(typedProduct.templateId)
            : undefined,
        type: normalizeOptionalString(typedProduct.type),
    }
}

function normalizeProjectPhase(phase: unknown): ProjectPhase | undefined {
    if (typeof phase !== 'object' || !phase) {
        return undefined
    }

    const typedPhase = phase as Partial<ProjectPhase>
    const id = normalizeOptionalString(typedPhase.id)
        || normalizeOptionalString((typedPhase as {
            phaseId?: unknown
        }).phaseId)

    if (!id) {
        return undefined
    }

    const products = Array.isArray(typedPhase.products)
        ? typedPhase.products
            .map(product => normalizeProjectPhaseProduct(product))
            .filter((product): product is ProjectPhaseProduct => !!product)
        : []

    return {
        id,
        name: normalizeOptionalString(typedPhase.name),
        products,
        status: normalizeOptionalString(typedPhase.status),
    }
}

function normalizeProjectAttachment(
    attachment: unknown,
): ProjectAttachment | undefined {
    if (typeof attachment !== 'object' || !attachment) {
        return undefined
    }

    const typedAttachment = attachment as Partial<ProjectAttachment>
    const id = typedAttachment.id !== undefined && typedAttachment.id !== null
        ? String(typedAttachment.id)
        : undefined
    const type = normalizeOptionalString(typedAttachment.type)
    const url = normalizeOptionalString(typedAttachment.url)

    if (!id && !type && !url) {
        return undefined
    }

    return {
        ...typedAttachment,
        allowedUsers: Array.isArray(typedAttachment.allowedUsers)
            ? typedAttachment.allowedUsers
                .map(user => String(user))
            : undefined,
        id,
        tags: Array.isArray(typedAttachment.tags)
            ? typedAttachment.tags
                .map(tag => String(tag))
            : undefined,
        type,
        url,
    }
}

function setValueByPath(
    target: Record<string, unknown>,
    path: string,
    value: unknown,
): Record<string, unknown> {
    const pathParts = path
        .split('.')
        .filter(Boolean)

    if (!pathParts.length) {
        return target
    }

    let currentTarget = target

    pathParts.forEach((pathPart, index) => {
        const isLastPart = index === pathParts.length - 1

        if (isLastPart) {
            currentTarget[pathPart] = value
            return
        }

        const existingValue = currentTarget[pathPart]

        if (!existingValue || typeof existingValue !== 'object') {
            currentTarget[pathPart] = {}
        }

        currentTarget = currentTarget[pathPart] as Record<string, unknown>
    })

    return target
}

function extractProjectTypes(response: unknown): ProjectType[] {
    if (Array.isArray(response)) {
        return response
            .map(projectType => normalizeProjectType(projectType as Partial<ProjectType>))
            .filter((projectType): projectType is ProjectType => !!projectType)
    }

    if (typeof response === 'object' && response) {
        const typedResponse = response as {
            data?: unknown
            result?: unknown
        }

        if (Array.isArray(typedResponse.data)) {
            return typedResponse.data
                .map(projectType => normalizeProjectType(projectType as Partial<ProjectType>))
                .filter((projectType): projectType is ProjectType => !!projectType)
        }

        if (Array.isArray(typedResponse.result)) {
            return typedResponse.result
                .map(projectType => normalizeProjectType(projectType as Partial<ProjectType>))
                .filter((projectType): projectType is ProjectType => !!projectType)
        }
    }

    return []
}

function normalizeProjectSummary(project: ProjectSummary): ProjectSummary {
    const invites = Array.isArray(project.invites)
        ? project.invites
        : []

    return {
        ...project,
        invites,
        isInvited: invites.length > 0,
    }
}

function buildProjectsUrl(page: number, memberOnly: boolean): string {
    const query = new URLSearchParams({
        page: String(page),
        perPage: String(PROJECTS_PER_PAGE),
        sort: 'lastActivityAt desc',
        status: PROJECT_STATUS.ACTIVE,
    })

    if (memberOnly) {
        query.set('memberOnly', 'true')
    }

    return `${PROJECTS_API_URL}?${query.toString()}`
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

function buildProjectsListUrl(
    {
        keyword,
        memberOnly,
        page = 1,
        perPage = PROJECTS_PAGE_SIZE,
        sortBy = 'lastActivityAt',
        sortOrder = 'desc',
        status,
    }: FetchProjectsListParams,
): string {
    const query = new URLSearchParams({
        fields: PROJECTS_LIST_FIELDS.join(','),
        page: String(page),
        perPage: String(perPage),
        sortBy,
        sortOrder,
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

/**
 * Fetch all available projects that can be used in the challenges filter.
 */
export async function fetchProjects(
    {
        memberOnly = false,
    }: FetchProjectsParams = {},
): Promise<ProjectSummary[]> {
    try {
        let page = 1
        let totalPages = 1
        const projects: ProjectSummary[] = []

        do {
            // eslint-disable-next-line no-await-in-loop
            const response = await xhrGetPaginatedAsync<ProjectSummary[]>(
                buildProjectsUrl(page, memberOnly),
            )

            projects.push(...(response.data || []))
            totalPages = Math.max(response.totalPages || 1, 1)
            page += 1
        } while (page <= totalPages)

        const uniqueProjects = new Map<string, ProjectSummary>()

        projects.forEach(project => {
            if (project?.id === undefined || project?.id === null || !project?.name) {
                return
            }

            uniqueProjects.set(String(project.id), normalizeProjectSummary(project))
        })

        return Array.from(uniqueProjects.values())
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch projects')
    }
}

/**
 * Fetch one project by id.
 */
export async function fetchProjectById(projectId: string): Promise<Project> {
    try {
        const project = await xhrGetAsync<Partial<Project>>(
            `${PROJECTS_API_URL}/${encodeURIComponent(projectId)}`,
        )

        return normalizeProject(project)
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch project')
    }
}

/**
 * Fetch project type metadata.
 */
export async function fetchProjectTypes(): Promise<ProjectType[]> {
    try {
        const response = await xhrGetAsync<unknown>(PROJECT_TYPES_API_URL)

        return extractProjectTypes(response)
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch project types')
    }
}

/**
 * Fetch paginated projects list with filters.
 */
export async function fetchProjectsList(
    params: FetchProjectsListParams = {},
): Promise<FetchProjectsListResponse> {
    const page = params.page || 1
    const perPage = params.perPage || PROJECTS_PAGE_SIZE

    try {
        const response = await xhrGetPaginatedAsync<ProjectSummary[]>(
            buildProjectsListUrl(params),
        )

        return {
            metadata: {
                page: response.page || page,
                perPage: response.perPage || perPage,
                total: response.total || 0,
                totalPages: response.totalPages || 0,
            },
            projects: (response.data || []).map(normalizeProjectSummary),
        }
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch projects list')
    }
}

/**
 * Create a project.
 */
export async function createProject(payload: CreateProjectPayload): Promise<Project> {
    try {
        const createdProject = await xhrPostAsync<CreateProjectPayload, Partial<Project>>(
            PROJECTS_API_URL,
            payload,
        )

        return normalizeProject(createdProject)
    } catch (error) {
        throw normalizeError(error, 'Failed to create project')
    }
}

/**
 * Update an existing project.
 */
export async function updateProject(
    projectId: string,
    payload: UpdateProjectPayload,
): Promise<Project> {
    try {
        const updatedProject = await xhrPatchAsync<UpdateProjectPayload, Partial<Project>>(
            `${PROJECTS_API_URL}/${encodeURIComponent(projectId)}`,
            payload,
        )

        return normalizeProject(updatedProject)
    } catch (error) {
        throw normalizeError(error, 'Failed to update project')
    }
}

/**
 * Add a member to project.
 */
export async function addMemberToProject(
    projectId: string,
    userId: number,
    role: string,
): Promise<ProjectMember> {
    try {
        const createdMember = await xhrPostAsync<{
            userId: number
            role: string
        }, Partial<ProjectMember>>(
            `${PROJECTS_API_URL}/${encodeURIComponent(projectId)}/members`,
            {
                role,
                userId,
            },
        )

        const normalizedMember = normalizeProjectMember(createdMember)

        if (!normalizedMember) {
            throw new Error('Created project member payload is invalid')
        }

        return normalizedMember
    } catch (error) {
        throw normalizeError(error, 'Failed to add project member')
    }
}

/**
 * Remove a project member.
 */
export async function removeMemberFromProject(
    projectId: string,
    memberId: string,
): Promise<void> {
    try {
        await xhrDeleteAsync<unknown>(
            `${PROJECTS_API_URL}/${encodeURIComponent(projectId)}/members/${encodeURIComponent(memberId)}`,
        )
    } catch (error) {
        throw normalizeError(error, 'Failed to remove project member')
    }
}

/**
 * Update role for a project member.
 */
export async function updateMemberRole(
    projectId: string,
    memberId: string,
    role: string,
    action?: string,
): Promise<ProjectMember> {
    const payload: {
        action?: string
        role: string
    } = {
        role,
    }

    if (action?.trim()) {
        payload.action = action.trim()
    }

    try {
        const updatedMember = await xhrPatchAsync<typeof payload, Partial<ProjectMember>>(
            `${PROJECTS_API_URL}/${encodeURIComponent(projectId)}/members/${encodeURIComponent(memberId)}`,
            payload,
        )

        const normalizedMember = normalizeProjectMember(updatedMember)

        if (!normalizedMember) {
            throw new Error('Updated project member payload is invalid')
        }

        return normalizedMember
    } catch (error) {
        throw normalizeError(error, 'Failed to update project member role')
    }
}

/**
 * Invite members to project.
 */
export async function inviteMemberToProject(
    projectId: string,
    params: {
        emails?: string[]
        handles?: string[]
        role: string
    },
): Promise<{
    failed?: Record<string, unknown>[]
    message?: string
    success: ProjectInvite[]
}> {
    try {
        return await createProjectMemberInvite(projectId, params)
    } catch (error) {
        throw normalizeError(error, 'Failed to invite project member')
    }
}

/**
 * Fetch project phases.
 */
export async function fetchProjectPhases(projectId: string): Promise<ProjectPhase[]> {
    try {
        const query = new URLSearchParams({
            fields: 'id,name,products,status',
        })
        const response = await xhrGetAsync<unknown[]>(
            `${PROJECTS_API_URL}/${encodeURIComponent(projectId)}/phases?${query.toString()}`,
        )

        return (response || [])
            .map(phase => normalizeProjectPhase(phase))
            .filter((phase): phase is ProjectPhase => !!phase)
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch project phases')
    }
}

function getProductChallengeId(product: ProjectPhaseProduct): string | undefined {
    const challengeIdFromDetails = (product.details as {
        challengeGuid?: unknown
    } | undefined)?.challengeGuid

    if (challengeIdFromDetails !== undefined && challengeIdFromDetails !== null) {
        return String(challengeIdFromDetails)
    }

    const value = PHASE_PRODUCT_CHALLENGE_ID_FIELD
        .split('.')
        .reduce<unknown>((accumulator, key) => {
            if (accumulator && typeof accumulator === 'object') {
                return (accumulator as Record<string, unknown>)[key]
            }

            return undefined
        }, product)

    if (value === undefined || value === null) {
        return undefined
    }

    return String(value)
}

/**
 * Remove challenge from phase product.
 */
export async function removeChallengeFromPhaseProduct(
    projectId: string,
    challengeId: string,
): Promise<void> {
    const phases = await fetchProjectPhases(projectId)
    let selectedProduct: {
        phaseId: string
        productId: string
    } | undefined

    phases.some(phase => {
        const product = (phase.products || []).find(item => (
            getProductChallengeId(item) === challengeId
        ))

        if (!product?.id) {
            return false
        }

        selectedProduct = {
            phaseId: phase.id,
            productId: product.id,
        }

        return true
    })

    if (!selectedProduct) {
        return
    }

    try {
        await xhrDeleteAsync<unknown>(
            `${PROJECTS_API_URL}/${encodeURIComponent(projectId)}`
            + `/phases/${encodeURIComponent(selectedProduct.phaseId)}`
            + `/products/${encodeURIComponent(selectedProduct.productId)}`,
        )
    } catch (error) {
        throw normalizeError(error, 'Failed to remove challenge from phase product')
    }
}

/**
 * Save challenge as phase product.
 */
export async function saveChallengeAsPhaseProduct(
    projectId: string,
    phaseId: string,
    challengeId: string,
    isNewChallenge: boolean = false,
): Promise<ProjectPhaseProduct> {
    if (!isNewChallenge) {
        await removeChallengeFromPhaseProduct(projectId, challengeId)
    }

    const payload: Record<string, unknown> = {
        actualPrice: 1,
        estimatedPrice: 1,
        name: GENERIC_PROJECT_MILESTONE_PRODUCT_NAME,
        templateId: PHASE_PRODUCT_TEMPLATE_ID,
        type: GENERIC_PROJECT_MILESTONE_PRODUCT_TYPE,
    }
    setValueByPath(payload, PHASE_PRODUCT_CHALLENGE_ID_FIELD, challengeId)

    try {
        const response = await xhrPostAsync<Record<string, unknown>, unknown>(
            `${PROJECTS_API_URL}/${encodeURIComponent(projectId)}`
            + `/phases/${encodeURIComponent(phaseId)}/products`,
            payload,
        )
        const normalizedProduct = normalizeProjectPhaseProduct(response)

        if (!normalizedProduct) {
            throw new Error('Project phase product payload is invalid')
        }

        return normalizedProduct
    } catch (error) {
        throw normalizeError(error, 'Failed to save challenge as phase product')
    }
}

/**
 * Fetch a project attachment.
 */
export async function fetchProjectAttachment(
    projectId: string,
    attachmentId: string,
): Promise<ProjectAttachment | undefined> {
    try {
        const response = await xhrGetAsync<unknown>(
            `${PROJECTS_API_URL}/${encodeURIComponent(projectId)}`
            + `/attachments/${encodeURIComponent(attachmentId)}`,
        )

        return normalizeProjectAttachment(response)
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch project attachment')
    }
}

/**
 * Fetch all project attachments.
 */
export async function fetchProjectAttachments(projectId: string): Promise<ProjectAttachment[]> {
    try {
        const response = await xhrGetAsync<unknown[]>(
            `${PROJECTS_API_URL}/${encodeURIComponent(projectId)}/attachments`,
        )

        return (response || [])
            .map(attachment => normalizeProjectAttachment(attachment))
            .filter((attachment): attachment is ProjectAttachment => !!attachment)
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch project attachments')
    }
}

/**
 * Add project attachment.
 */
export async function addProjectAttachment(
    projectId: string,
    attachment: ProjectAttachmentPayload,
): Promise<ProjectAttachment> {
    const payload: ProjectAttachmentPayload = {
        ...attachment,
        tags: Array.isArray(attachment.tags)
            ? attachment.tags
            : [],
    }

    if (payload.type === ATTACHMENT_TYPE_FILE) {
        payload.s3Bucket = FILE_PICKER_SUBMISSION_CONTAINER_NAME
    }

    try {
        const response = await xhrPostAsync<ProjectAttachmentPayload, unknown>(
            `${PROJECTS_API_URL}/${encodeURIComponent(projectId)}/attachments`,
            payload,
        )
        const normalizedAttachment = normalizeProjectAttachment(response)

        if (!normalizedAttachment) {
            throw new Error('Project attachment payload is invalid')
        }

        return normalizedAttachment
    } catch (error) {
        throw normalizeError(error, 'Failed to add project attachment')
    }
}

/**
 * Update project attachment.
 */
export async function updateProjectAttachment(
    projectId: string,
    attachmentId: string,
    attachment: ProjectAttachmentPayload,
): Promise<ProjectAttachment> {
    const payload: ProjectAttachmentPayload = {
        ...attachment,
    }

    if (payload.allowedUsers && payload.allowedUsers.length === 0) {
        payload.allowedUsers = undefined
    }

    if (!payload.tags) {
        payload.tags = []
    }

    try {
        const response = await xhrPatchAsync<ProjectAttachmentPayload, unknown>(
            `${PROJECTS_API_URL}/${encodeURIComponent(projectId)}`
            + `/attachments/${encodeURIComponent(attachmentId)}`,
            payload,
        )
        const normalizedAttachment = normalizeProjectAttachment(response)

        if (!normalizedAttachment) {
            throw new Error('Updated project attachment payload is invalid')
        }

        return normalizedAttachment
    } catch (error) {
        throw normalizeError(error, 'Failed to update project attachment')
    }
}

/**
 * Remove project attachment.
 */
export async function removeProjectAttachment(
    projectId: string,
    attachmentId: string,
): Promise<void> {
    try {
        await xhrDeleteAsync<unknown>(
            `${PROJECTS_API_URL}/${encodeURIComponent(projectId)}`
            + `/attachments/${encodeURIComponent(attachmentId)}`,
        )
    } catch (error) {
        throw normalizeError(error, 'Failed to remove project attachment')
    }
}

/**
 * Fetch member profiles for invite user IDs.
 */
export async function fetchInviteMembers(
    userIds: Array<number | string>,
): Promise<Record<number, InviteMember>> {
    const normalizedUserIds = Array.from(new Set(
        userIds
            .map(userId => String(userId)
                .trim())
            .filter(Boolean),
    ))

    if (!normalizedUserIds.length) {
        return {}
    }

    const query = normalizedUserIds
        .map(userId => `userIds[]=${encodeURIComponent(userId)}`)
        .join('&')

    try {
        const response = await xhrGetAsync<unknown[]>(
            `${MEMBER_API_URL}?${query}`,
        )
        const members = Array.isArray(response)
            ? response
            : []

        return members.reduce<Record<number, InviteMember>>((accumulator, member) => {
            if (!member || typeof member !== 'object') {
                return accumulator
            }

            const typedMember = member as InviteMember
            const memberUserId = Number(typedMember.userId)

            if (!Number.isFinite(memberUserId)) {
                return accumulator
            }

            accumulator[memberUserId] = {
                ...typedMember,
                handle: normalizeOptionalString(typedMember.handle),
                userId: memberUserId,
            }

            return accumulator
        }, {})
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch invite members')
    }
}

/**
 * Fetch invited members handles by user IDs.
 */
export async function fetchInvitedMembers(
    userIds: number[],
): Promise<Record<number, {
    handle: string
}>> {
    const uniqueUserIds = Array.from(new Set(
        userIds
            .filter(userId => Number.isFinite(userId))
            .map(userId => String(userId)),
    ))

    if (!uniqueUserIds.length) {
        return {}
    }

    try {
        const invitedMembers: Record<number, {
            handle: string
        }> = {}
        const inviteMembers = await fetchInviteMembers(uniqueUserIds)

        Object.entries(inviteMembers)
            .forEach(([userId, member]) => {
                const normalizedUserId = Number(userId)
                const normalizedHandle = normalizeOptionalString(member.handle)

                if (!Number.isFinite(normalizedUserId) || !normalizedHandle) {
                    return
                }

                invitedMembers[normalizedUserId] = {
                    handle: normalizedHandle,
                }
            })

        if (Object.keys(invitedMembers).length > 0) {
            return invitedMembers
        }

        const users = await searchProfilesByUserIds(uniqueUserIds)

        users.forEach(user => {
            const normalizedUserId = Number(user.userId)
            const normalizedHandle = normalizeOptionalString(user.handle)

            if (!Number.isFinite(normalizedUserId) || !normalizedHandle) {
                return
            }

            invitedMembers[normalizedUserId] = {
                handle: normalizedHandle,
            }
        })

        return invitedMembers
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch invited member handles')
    }
}
