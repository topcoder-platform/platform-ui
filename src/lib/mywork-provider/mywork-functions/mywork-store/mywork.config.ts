import { EnvironmentConfig } from '../../../../config'

export function getMyWorkUrl(handle: string, page: number, perPage: number): string {
    return `${EnvironmentConfig.API.V5}/members/${handle}`
}
