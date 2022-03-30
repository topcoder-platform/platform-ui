import { getAsync } from './work-store'
import { tokenGetAsync } from '../../functions/token-functions'
import { WorkList } from './work-store'

export async function getAsync(handle: string, page?: number, perPage?: number): Promise<WorkList | undefined> {
    page = page || 1
    perPage = perPage || 100
    return getAsync(handle, page, perPage)
}
