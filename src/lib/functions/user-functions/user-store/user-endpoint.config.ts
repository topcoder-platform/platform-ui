import { EnvironmentConfig } from '../../../../config'

export  function user(userId: number): string {
    return `${EnvironmentConfig.API.V5}/users/${userId}`
}
