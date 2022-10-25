import { learnUrlGet, learnXhrGetAsync } from '../../../functions'

import { ResourceProvider } from './resource-provider.model'

export function getResourceProvidersAsync(): Promise<Array<ResourceProvider> | undefined> {

    const url: string = learnUrlGet('providers')
    return learnXhrGetAsync<Array<ResourceProvider>>(url)
}
