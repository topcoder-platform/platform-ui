import { get } from './work-store'
import { tokenGetAsync } from '../../functions/token-functions'
import { WorkList } from './work-model'

export async function getAsync(handle?: string, page?: number, perPage?: number): Promise<WorkList | undefined> {
    handle = handle || (await tokenGetAsync())?.handle
    page = page || 1
    perPage = perPage || 100
    return !handle ? Promise.resolve(undefined) : get(handle, page, perPage)
}
