import { find } from 'lodash'
import useSWR, { SWRConfiguration, SWRResponse } from 'swr'

import { learnUrlGet } from '../../functions'
import { useSwrCache } from '../../learn-swr'

import { ResourceProviderData } from './resource-provider-data.model'
import { ResourceProvider } from './resource-provider.model'

export function useGetResourceProvider(providerName?: string): ResourceProviderData {

    const url: string = learnUrlGet('providers')
    const swrCacheConfig: SWRConfiguration = useSwrCache(url)

    const {data, error}: SWRResponse<ReadonlyArray<ResourceProvider>> = useSWR(url, swrCacheConfig)

    return {
        loading: !data && !error,
        provider: find(data, {name: providerName}),
        ready: !!data || !!error,
    }
}
