import { WorkList, workStoreGetAsync } from './work-store'

export async function workGetAsync(handle: string, page?: number, perPage?: number): Promise<WorkList | undefined> {
    page = page || 1
    perPage = perPage || 100
    return workStoreGetAsync(handle, page, perPage)
}
