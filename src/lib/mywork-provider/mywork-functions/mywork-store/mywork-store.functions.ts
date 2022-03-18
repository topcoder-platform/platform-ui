import { xhrGet } from 'src/lib/functions'
import { myWorkUrl } from './mywork.config.ts'

export async function get(handle: string, page: number, perPage: number): Promise<WorkList> {
    return xhrGet<WorkList>(myWorkUrl(handle))
}
