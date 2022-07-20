import { xhrGetAsync } from '../../../../../lib/functions'
import { getPath } from '../../learn-url.config'
import { ResourceProvider } from './resource-provider.model'


export function getResourceProvidersAsync(): Promise<Array<ResourceProvider>|undefined> {
    return xhrGetAsync<Array<ResourceProvider>>(getPath(
        'providers'
    ))
}
