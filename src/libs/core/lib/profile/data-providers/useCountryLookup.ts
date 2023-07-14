import { SWRResponse } from 'swr'
import useSWRImmutable from 'swr/immutable'

import { CountryLookup, countryLookupURL } from '~/libs/core'

export function useCountryLookup(): CountryLookup[] | undefined {
    const { data }: SWRResponse = useSWRImmutable(countryLookupURL)

    return data ? data.result?.content : undefined
}
