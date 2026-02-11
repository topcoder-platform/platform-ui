import { isNil } from 'lodash'

import { Resource } from '../models'

export type SortOrder = 'asc' | 'desc'

export interface SortField<T> {
    field: keyof T | string
    order?: SortOrder
}

function compareValues(valueA: number | string, valueB: number | string): number {
    if (valueA > valueB) {
        return 1
    }

    if (valueA === valueB) {
        return 0
    }

    return -1
}

function normalizeDate(value: string | undefined): number {
    if (!value) {
        return 0
    }

    const timestamp = new Date(value)
        .getTime()

    return Number.isFinite(timestamp)
        ? timestamp
        : 0
}

function normalizeString(value: string | undefined): string {
    return (value || '').toLowerCase()
}

function resolveSortValue(resource: Resource, sortBy: string): number | string {
    if (sortBy === 'Role') {
        return normalizeString(resource.role || resource.roleName)
    }

    if (sortBy === 'Handle') {
        return normalizeString(resource.memberHandle)
    }

    if (sortBy === 'Email') {
        return normalizeString(resource.email)
    }

    if (sortBy === 'Registration Date') {
        return normalizeDate(resource.created)
    }

    return 0
}

function normalizeComparableValue(value: unknown, treatAsString: boolean): number | string {
    if (treatAsString) {
        return isNil(value)
            ? ''
            : String(value)
                .toLowerCase()
    }

    const parsedNumber = Number(value)

    return Number.isFinite(parsedNumber)
        ? parsedNumber
        : 0
}

function resolveValue<T>(item: T, field: keyof T | string): unknown {
    if (typeof field !== 'string') {
        return item[field]
    }

    if (!field.includes('.')) {
        return (item as Record<string, unknown>)[field]
    }

    return field
        .split('.')
        .reduce<unknown>((accumulator, key) => {
            if (accumulator && typeof accumulator === 'object') {
                return (accumulator as Record<string, unknown>)[key]
            }

            return undefined
        }, item)
}

export function sortList<T>(
    list: T[],
    field: string,
    sort: SortOrder,
    getValue: (valueA: T, valueB: T) => {
        valueA: unknown
        valueB: unknown
        valueIsString?: boolean
    },
): T[] {
    list.sort((valueA, valueB) => {
        const {
            valueA: rawValueA,
            valueB: rawValueB,
            valueIsString = false,
        }: {
            valueA: unknown
            valueB: unknown
            valueIsString?: boolean
        } = getValue(valueA, valueB)
        const normalizedValueA = normalizeComparableValue(rawValueA, valueIsString)
        const normalizedValueB = normalizeComparableValue(rawValueB, valueIsString)

        if (sort === 'desc') {
            return compareValues(normalizedValueB, normalizedValueA)
        }

        return compareValues(normalizedValueA, normalizedValueB)
    })

    return list
}

export function createComparator<T>(
    field: keyof T | string,
    order: SortOrder = 'asc',
): (itemA: T, itemB: T) => number {
    return (itemA: T, itemB: T) => {
        const valueA = resolveValue(itemA, field)
        const valueB = resolveValue(itemB, field)
        const normalizedValueA = normalizeComparableValue(
            valueA,
            typeof valueA === 'string' || typeof valueB === 'string',
        )
        const normalizedValueB = normalizeComparableValue(
            valueB,
            typeof valueA === 'string' || typeof valueB === 'string',
        )

        if (order === 'desc') {
            return compareValues(normalizedValueB, normalizedValueA)
        }

        return compareValues(normalizedValueA, normalizedValueB)
    }
}

export function sortByFields<T>(
    list: T[],
    sortFields: SortField<T>[],
): T[] {
    const sortedList = [...list]

    sortedList.sort((itemA, itemB) => {
        for (const sortField of sortFields) {
            const result = createComparator<T>(
                sortField.field,
                sortField.order || 'asc',
            )(itemA, itemB)

            if (result !== 0) {
                return result
            }
        }

        return 0
    })

    return sortedList
}

export function sortResources(
    resources: Resource[],
    sortBy: string,
    sortOrder: SortOrder,
): Resource[] {
    const sortedResources = [...resources]

    sortedResources.sort((resourceA, resourceB) => {
        const valueA = resolveSortValue(resourceA, sortBy)
        const valueB = resolveSortValue(resourceB, sortBy)

        if (sortOrder === 'desc') {
            return compareValues(valueB, valueA)
        }

        return compareValues(valueA, valueB)
    })

    return sortedResources
}
