import { xhrGetAsync } from '../../../functions'
import { getWorkUrl } from './work.config'
import { WorkList } from '../work-model'

export async function getAsync(handle: string, page: number, perPage: number): Promise<WorkList> {
    return xhrGetAsync<WorkList>(getWorkUrl(handle, page, perPage))
}
