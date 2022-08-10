import { xhrGetAsync } from '../../../../../lib/functions'
import { learnUrlGet } from '../../functions'

import { ResourceProvider } from './resource-provider.model'

export function getResourceProvidersAsync(): Promise<Array<ResourceProvider> | undefined> {

    const url: string = learnUrlGet('providers')
    return xhrGetAsync<Array<ResourceProvider>>(url)
}
