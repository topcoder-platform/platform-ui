import { EnvironmentConfig } from '../../../../../../config'
import { Page } from '../../../../../../lib'

export function deleteUrl(workId: string): string {
    return `${challengesPath}/${workId}`
}

export function getUrl(handle: string, page: Page): string {
    return `${challengesPath}?createdBy=${handle}&perPage=${page.size}&page=${page.number}&selfService=true`
}

const challengesPath: string = `${EnvironmentConfig.API.V5}/challenges`
