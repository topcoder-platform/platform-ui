import { PaginationModel } from '../models'

interface PaginatedHeadersSource {
    headers?: Record<string, unknown>
}

interface PaginationValueMap {
    page: number
    perPage: number
    total: number
    totalPages: number
}

function normalizeHeaderValue(value: unknown): number {
    const parsedValue = Number(value)

    if (!Number.isFinite(parsedValue)) {
        return 0
    }

    return parsedValue
}

function resolveHeaderMap(input: PaginatedHeadersSource | Record<string, unknown>): Record<string, unknown> {
    if ('headers' in input && input.headers && typeof input.headers === 'object') {
        return input.headers as Record<string, unknown>
    }

    return input as Record<string, unknown>
}

export function paginationHeaders(
    response: PaginatedHeadersSource | Record<string, unknown>,
): PaginationValueMap {
    const headers = resolveHeaderMap(response)

    return {
        page: normalizeHeaderValue(headers['x-page']),
        perPage: normalizeHeaderValue(headers['x-per-page']),
        total: normalizeHeaderValue(headers['x-total']),
        totalPages: normalizeHeaderValue(headers['x-total-pages']),
    }
}

export function buildPaginationMetadata(
    overrides: Partial<PaginationModel> = {},
): PaginationModel {
    const page = Number(overrides.page) || 1
    const perPage = Number(overrides.perPage) || 0
    const total = Number(overrides.total) || 0
    const totalPages = Number(overrides.totalPages) || Math.ceil(total / Math.max(perPage, 1))

    return {
        page,
        perPage,
        total,
        totalPages,
    }
}

export function getPageRange(
    currentPage: number,
    totalPages: number,
    maxVisiblePages: number = 5,
): number[] {
    const safeCurrentPage = Math.max(1, Math.trunc(currentPage))
    const safeTotalPages = Math.max(1, Math.trunc(totalPages))
    const safeMaxVisiblePages = Math.max(1, Math.trunc(maxVisiblePages))
    const halfWindow = Math.floor(safeMaxVisiblePages / 2)
    const startPage = Math.max(1, safeCurrentPage - halfWindow)
    const endPage = Math.min(
        safeTotalPages,
        startPage + safeMaxVisiblePages - 1,
    )
    const adjustedStart = Math.max(1, endPage - safeMaxVisiblePages + 1)

    return Array.from(
        { length: endPage - adjustedStart + 1 },
        (_, index) => adjustedStart + index,
    )
}
