import { xhrGetAsync } from '../../../functions'

import { WorkList } from './work-model'
import { getWorkUrl } from './work.config'

export async function workStoreGetAsync(handle: string, page: number, perPage: number): Promise<WorkList> {
    return xhrGetAsync<WorkList>(getWorkUrl(handle, page, perPage))
}
