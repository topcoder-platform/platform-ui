import {
    xhrGetAsync,
    xhrGetPaginatedAsync,
} from '~/libs/core'

import {
    PROJECTS_API_URL,
    PROJECTS_PAGE_SIZE,
} from '../constants'
import type {
    FetchProjectShowcasePostsParams,
    FetchProjectShowcasePostsResponse,
    ProjectShowcasePostCategory,
    ProjectShowcasePostIndustry,
} from '../models'

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

        return {
            metadata: {
                page: response.page || 0,
                perPage: response.perPage || 20,
                total: response.total || 0,
                totalPages: response.totalPages || 0,
            },
            posts: (response.data || []).map((post: any) => ({
                categories: Array.isArray(post.categories)
                    ? post.categories.map((category: any) => ({
                        id: String(category.id),
                        name: String(category.name || ''),
                    }))
                    : [],
                createdAt: String(post.createdAt || ''),
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
            })),
        }
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch showcase posts')
    }
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
