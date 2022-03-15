import { EnvironmentConfig } from '../../../../config'

export  function user(userId: string): string {
    return `${EnvironmentConfig.API.V5}/users/${userId}`
}
