import { SWRResponse } from 'swr'
import useSWRImmutable from 'swr/immutable'

import { CountryLookup, countryLookupURL } from '~/libs/core'

export function useCountryName(countryCode?: string): string | undefined {
    // Resolve the URL early; keep the hook disabled if no code is provided
    const key = countryCode ? countryLookupURL() : undefined
    const { data }: SWRResponse = useSWRImmutable(key)

    if (!data || !countryCode) {
        return undefined
    }

    const list: any[] = Array.isArray(data)
        ? data
        : Array.isArray((data as any)?.result?.content)
            ? (data as any).result.content
            : Array.isArray((data as any)?.result)
                ? (data as any).result
                : Array.isArray((data as any)?.data)
                    ? (data as any).data
                    : []

    const match: CountryLookup | any = list.find(
        (countryLookup: any) => countryLookup.countryCode === countryCode,
    )

    return (match?.country ?? match?.name) as string | undefined
}
