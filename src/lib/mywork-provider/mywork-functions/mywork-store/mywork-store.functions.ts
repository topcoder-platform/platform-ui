import { xhrGetAsync } from '../../../functions'
import { getMyWorkUrl } from './mywork.config'
import { WorkList } from '../mywork-model/WorkList.model'

export async function get(handle: string, page: number, perPage: number): Promise<WorkList> {
    return xhrGetAsync<WorkList>(getMyWorkUrl(handle, page, perPage))
}
