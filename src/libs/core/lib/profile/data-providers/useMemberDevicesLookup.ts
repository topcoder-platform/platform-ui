import { SWRResponse } from 'swr'
import useSWRImmutable from 'swr/immutable'

import { EnvironmentConfig } from '~/config'

export function useMemberDevicesLookup(query: string | undefined): string[] | { [key: string]: string } | undefined {
    const { data }: SWRResponse
        = useSWRImmutable(!!query ? `${EnvironmentConfig.API.V5}/lookups/devices${query}` : undefined)

    return data
}
