import { SWRResponse } from 'swr'
import useSWRImmutable from 'swr/immutable'

import { CountryLookup, countryLookupURL } from '~/libs/core'

export function useCountryName(countryCode?: string): string | undefined {
    const { data }: SWRResponse = useSWRImmutable(countryCode ? countryLookupURL : undefined)

    const countryLookupData: CountryLookup | undefined
        = data?.result?.content?.find((countryLookup: CountryLookup) => countryLookup.countryCode === countryCode)

    return countryLookupData?.country
}
