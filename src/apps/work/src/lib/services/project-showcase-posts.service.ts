import {
    xhrGetAsync,
    xhrGetPaginatedAsync,
    xhrPatchAsync,
    xhrPostAsync,
} from '~/libs/core'

import {
    PROJECTS_API_URL,
    PROJECTS_PAGE_SIZE,
} from '../constants'
import type {
    FetchProjectShowcasePostsParams,
    FetchProjectShowcasePostsResponse,
    ProjectShowcasePost,
    ProjectShowcasePostCategory,
    ProjectShowcasePostIndustry,
    ProjectShowcasePostTaxonomyItem,
} from '../models'

import { fetchMembersByUserIds } from './members.service'

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

function buildProjectShowcasePostsSortValue(
    sortBy: string,
    sortOrder: 'asc' | 'desc',
): string {
    const normalizedSortBy = sortBy.trim() || 'updatedAt'
    const safeSortOrder = sortOrder === 'asc' ? 'asc' : 'desc'

    return `${normalizedSortBy} ${safeSortOrder}`
}

function buildProjectShowcasePostsUrl(
    params: FetchProjectShowcasePostsParams,
): string {
    const page = params.page || 1
    const perPage = params.perPage || PROJECTS_PAGE_SIZE
    const query = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
    })

    if (params.keyword?.trim()) {
        query.set('keyword', params.keyword.trim())
    }

    if (params.status?.trim()) {
        query.set('status', params.status.trim())
    }

    if (params.industryId?.trim()) {
        query.set('industryId', params.industryId.trim())
    }

    if (params.categoryId?.trim()) {
        query.set('categoryId', params.categoryId.trim())
    }

    if (params.sortBy?.trim() && params.sortOrder) {
        query.set(
            'sort',
            buildProjectShowcasePostsSortValue(params.sortBy, params.sortOrder),
        )
    }

    return `${PROJECTS_API_URL}/${encodeURIComponent(params.projectId)}/posts?${query.toString()}`
}

export async function fetchProjectShowcasePosts(
    params: FetchProjectShowcasePostsParams,
): Promise<FetchProjectShowcasePostsResponse> {
    try {
        const response = await xhrGetPaginatedAsync<any>(
            buildProjectShowcasePostsUrl(params),
        )

        const posts = (response.data || []).map((post: any) => ({
            categories: Array.isArray(post.categories)
                ? post.categories.map((category: any) => ({
                    id: String(category.id),
                    name: String(category.name || ''),
                }))
                : [],
            createdAt: String(post.createdAt || ''),
            createdByHandle: post.createdByHandle !== undefined && post.createdByHandle !== null
                ? String(post.createdByHandle)
                : undefined,
            createdById: Number(post.createdById || 0),
            id: String(post.id),
            industries: Array.isArray(post.industries)
                ? post.industries.map((industry: any) => ({
                    id: String(industry.id),
                    name: String(industry.name || ''),
                }))
                : [],
            status: String(post.status || ''),
            title: String(post.title || ''),
        }))

        const creatorUserIds: string[] = Array.from(new Set<string>(
            posts
                .map((post: ProjectShowcasePost) => String(post.createdById))
                .filter((userId: string) => userId && userId !== '0'),
        ))

        if (creatorUserIds.length) {
            const members = await fetchMembersByUserIds(creatorUserIds, 'userId,handle')
            const handleByUserId = new Map<string, string>()

            members.forEach(member => {
                if (member.userId && member.handle) {
                    handleByUserId.set(member.userId, member.handle)
                }
            })

            posts.forEach((post: ProjectShowcasePost) => {
                if (!post.createdByHandle) {
                    const handle = handleByUserId.get(String(post.createdById))
                    if (handle) {
                        post.createdByHandle = handle
                    }
                }
            })
        }

        return {
            metadata: {
                page: response.page || 0,
                perPage: response.perPage || 20,
                total: response.total || 0,
                totalPages: response.totalPages || 0,
            },
            posts,
        }
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch showcase posts')
    }
}

function normalizeTaxonomyArray(value: unknown): ProjectShowcasePostTaxonomyItem[] {
    if (!Array.isArray(value)) {
        return []
    }

    return value.map((item: any) => ({
        id: String(item?.id || ''),
        name: String(item?.name || ''),
    }))
}

function normalizeString(value: unknown): string {
    return value !== undefined && value !== null
        ? String(value)
        : ''
}

function normalizeStringOrUndefined(value: unknown): string | undefined {
    return value !== undefined && value !== null
        ? String(value)
        : undefined
}

function normalizeProjectShowcasePost(value: unknown): ProjectShowcasePost | undefined {
    if (typeof value !== 'object' || value === null) {
        return undefined
    }

    const post = value as Record<string, unknown>

    return {
        categories: normalizeTaxonomyArray(post.categories),
        challengeIds: Array.isArray(post.challengeIds)
            ? post.challengeIds.map((item: any) => String(item))
            : [],
        content: normalizeStringOrUndefined(post.content),
        createdAt: normalizeString(post.createdAt),
        createdByHandle: normalizeStringOrUndefined(post.createdByHandle),
        createdById: Number(post.createdById || 0),
        id: normalizeString(post.id),
        industries: normalizeTaxonomyArray(post.industries),
        projectId: normalizeStringOrUndefined(post.projectId),
        status: normalizeString(post.status),
        title: normalizeString(post.title),
    }
}

export async function fetchProjectShowcasePost(
    projectId: string,
    postId: string,
): Promise<ProjectShowcasePost> {
    try {
        const response = await xhrGetAsync<unknown>(
            `${PROJECTS_API_URL}/${encodeURIComponent(projectId)}/posts/${encodeURIComponent(postId)}`,
        )

        const normalized = normalizeProjectShowcasePost(response)
        if (!normalized) {
            throw new Error('Failed to normalize showcase post')
        }

        return normalized
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch showcase post')
    }
}

export async function createProjectShowcasePost(
    projectId: string,
    payload: {
        title: string
        content: string
        industryIds: string[]
        categoryIds: string[]
        challengeIds?: string[]
    },
): Promise<ProjectShowcasePost> {
    try {
        const response = await xhrPostAsync<typeof payload, unknown>(
            `${PROJECTS_API_URL}/${encodeURIComponent(projectId)}/posts`,
            payload,
        )

        const normalized = normalizeProjectShowcasePost(response)
        if (!normalized) {
            throw new Error('Failed to normalize showcase post')
        }

        return normalized
    } catch (error) {
        throw normalizeError(error, 'Failed to create showcase post')
    }
}

export async function updateProjectShowcasePost(
    projectId: string,
    postId: string,
    payload: {
        title?: string
        content?: string
        industryIds?: string[]
        categoryIds?: string[]
        challengeIds?: string[]
        status?: string
    },
): Promise<ProjectShowcasePost> {
    try {
        const response = await xhrPatchAsync<typeof payload, unknown>(
            `${PROJECTS_API_URL}/${encodeURIComponent(projectId)}/posts/${encodeURIComponent(postId)}`,
            payload,
        )

        const normalized = normalizeProjectShowcasePost(response)
        if (!normalized) {
            throw new Error('Failed to normalize showcase post')
        }

        return normalized
    } catch (error) {
        throw normalizeError(error, 'Failed to update showcase post')
    }
}

export async function archiveProjectShowcasePost(
    projectId: string,
    postId: string,
): Promise<ProjectShowcasePost> {
    return updateProjectShowcasePost(projectId, postId, { status: 'ARCHIVED' })
}

function normalizeTaxonomyItem(value: unknown): ProjectShowcasePostCategory | undefined {
    if (typeof value !== 'object' || value === null) {
        return undefined
    }

    const item = value as Partial<ProjectShowcasePostCategory>
    const id = item.id !== undefined && item.id !== null
        ? String(item.id)
        : ''
    const name = item.name !== undefined && item.name !== null
        ? String(item.name)
        : ''
    const trimmedName = name.trim()

    if (!id || !trimmedName) {
        return undefined
    }

    return { id, name: trimmedName }
}

export async function createProjectShowcasePostIndustry(
    name: string,
): Promise<ProjectShowcasePostIndustry> {
    try {
        const response = await xhrPostAsync<{ name: string }, unknown>(
            `${PROJECTS_API_URL}/posts/industries`,
            { name },
        )

        const normalized = normalizeTaxonomyItem(response)
        if (!normalized) {
            throw new Error('Failed to normalize showcase post industry')
        }

        return normalized
    } catch (error) {
        throw normalizeError(error, 'Failed to create showcase post industry')
    }
}

export async function createProjectShowcasePostCategory(
    name: string,
): Promise<ProjectShowcasePostCategory> {
    try {
        const response = await xhrPostAsync<{ name: string }, unknown>(
            `${PROJECTS_API_URL}/posts/categories`,
            { name },
        )

        const normalized = normalizeTaxonomyItem(response)
        if (!normalized) {
            throw new Error('Failed to normalize showcase post category')
        }

        return normalized
    } catch (error) {
        throw normalizeError(error, 'Failed to create showcase post category')
    }
}

function sortTaxonomyItems<T extends ProjectShowcasePostCategory>(items: T[]): T[] {
    return items
        .slice()
        .sort((left, right) => left.name.localeCompare(right.name))
}

export async function fetchProjectShowcasePostIndustries(): Promise<ProjectShowcasePostIndustry[]> {
    try {
        const response = await xhrGetAsync<unknown[]>(
            `${PROJECTS_API_URL}/posts/industries`,
        )

        return sortTaxonomyItems(
            (response || [])
                .map(normalizeTaxonomyItem)
                .filter((item): item is ProjectShowcasePostIndustry => !!item),
        )
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch showcase industries')
    }
}

export async function fetchProjectShowcasePostCategories(): Promise<ProjectShowcasePostCategory[]> {
    try {
        const response = await xhrGetAsync<unknown[]>(
            `${PROJECTS_API_URL}/posts/categories`,
        )

        return sortTaxonomyItems(
            (response || [])
                .map(normalizeTaxonomyItem)
                .filter((item): item is ProjectShowcasePostCategory => !!item),
        )
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch showcase categories')
    }
}
