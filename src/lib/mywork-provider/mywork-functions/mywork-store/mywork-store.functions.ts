//import { xhrGet } from 'src/lib/functions'
import { xhrGet, xhrPut } from '../../../functions'
import { getMyWorkUrl } from './mywork.config'
import { WorkList } from '../mywork-model/WorkList.model'

export async function get(handle: string, page: number, perPage: number): Promise<WorkList> {
    return xhrGet<WorkList>(getMyWorkUrl(handle, page, perPage))
}
