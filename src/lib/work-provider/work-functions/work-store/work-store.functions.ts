import { xhrGetAsync } from '../../../functions'
import { getWorkUrl } from './work.config'
import { WorkList } from '../work-model/WorkList.model'

export async function get(handle: string, page: number, perPage: number): Promise<WorkList> {
    return xhrGetAsync<WorkList>(getWorkUrl(handle, page, perPage))
}
