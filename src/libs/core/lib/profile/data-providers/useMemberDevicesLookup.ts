import { SWRResponse } from 'swr'
import useSWRImmutable from 'swr/immutable'

import { EnvironmentConfig } from '~/config'

export function useMemberDevicesLookup(
    query: string | undefined,
): string[] | { [key: string]: string } | any[] | undefined {
    const { data }: SWRResponse
        = useSWRImmutable(!!query ? `${EnvironmentConfig.API.V6}/lookups/devices${query}` : undefined)

    // Normalize response shapes for known lookup endpoints so UI can safely map
    // - /types -> string[]
    // - /manufacturers -> string[]
    if (!data) {
        return data
    }

    const isTypes = query?.startsWith('/types')
    const isManufacturers = query?.startsWith('/manufacturers')

    if (isTypes || isManufacturers) {
        if (Array.isArray(data)) {
            return data
        }

        if (Array.isArray((data as any)?.data)) {
            return (data as any).data
        }

        if (Array.isArray((data as any)?.result)) {
            return (data as any).result
        }

        if (typeof data === 'object') {
            // Some APIs return key/value maps; convert values to array of strings
            return Object.values(data as Record<string, string>)
        }

        if (typeof data === 'string') {
            try {
                const parsed = JSON.parse(data)
                return Array.isArray(parsed) ? parsed : []
            } catch {
                return []
            }
        }

        return []
    }

    // For other queries (e.g., filtered device lists), unwrap common API envelope shapes
    if (Array.isArray((data as any)?.result)) {
        return (data as any).result
    }

    if (Array.isArray((data as any)?.data)) {
        return (data as any).data
    }

    return data
}
