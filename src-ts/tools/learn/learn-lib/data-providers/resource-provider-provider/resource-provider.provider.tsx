import { find } from 'lodash'
import useSWR, { SWRResponse } from 'swr'
import { learnUrlGet } from '../../functions'

import { ResourceProviderData } from './resource-provider-data.model'
import { ResourceProvider } from './resource-provider.model'

export function useGetResourceProvider(providerName?: string): ResourceProviderData {

    const url: string = learnUrlGet('providers')

    const {data, error}: SWRResponse<ReadonlyArray<ResourceProvider>> = useSWR(url)

    return {
        provider: find(data, {name: providerName}),
        loading: !data && !error,
        ready: !!data || !!error,
    }
}
