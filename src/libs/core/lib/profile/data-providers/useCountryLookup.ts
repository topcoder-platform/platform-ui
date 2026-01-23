import { useMemo } from 'react'
import { SWRResponse } from 'swr'
import useSWRImmutable from 'swr/immutable'

import { CountryLookup, countryLookupURL } from '~/libs/core'

export function useCountryLookup(): CountryLookup[] | undefined {
    // Use the resolved URL string as the SWR key to avoid any ambiguity
    // with functional keys across SWR versions/configs.
    const { data }: SWRResponse = useSWRImmutable(countryLookupURL())

    return useMemo(() => {
        if (!data) {
            return undefined
        }

        // Unwrap common API envelope shapes and normalize to CountryLookup
        const list: any[] = Array.isArray(data)
            ? data
            : Array.isArray((data as any)?.result?.content)
                ? (data as any).result.content
                : Array.isArray((data as any)?.result)
                    ? (data as any).result
                    : Array.isArray((data as any)?.data)
                        ? (data as any).data
                        : []

        return list.map((c: any) => ({
            country: c.country ?? c.name ?? '',
            countryCode: c.countryCode ?? c.code ?? c.isoCode ?? c.isoCode3 ?? c.isoCode2 ?? '',
        }))
    }, [data])
}
