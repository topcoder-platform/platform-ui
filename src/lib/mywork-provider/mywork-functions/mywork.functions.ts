import { get } from './mywork-store/mywork-store.functions'
import { tokenGet } from '../../functions/token-functions'
import { WorkList } from './mywork-model/WorkList.model'

export async function getAsync(handle?: string, page?: number, perPage?: number): Promise<WorkList | undefined> {
    handle = handle || (await tokenGet())?.handle
    page = page || 1
    perPage = perPage || 10
    return !handle ? Promise.resolve(undefined) : get(handle, page, perPage)
}
