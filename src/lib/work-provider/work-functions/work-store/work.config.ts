import { EnvironmentConfig } from '../../../../config'

export function getWorkUrl(handle: string, page: number, perPage: number): string {
    return `${EnvironmentConfig.API.V5}/challenges?createdBy=${handle}&perPage=${perPage}&page=${page}&selfService=true`
}
