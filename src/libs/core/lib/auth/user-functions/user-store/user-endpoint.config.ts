import { EnvironmentConfig } from '~/config'

export function user(userId: number): string {
    return `${EnvironmentConfig.API.V6}/users/${userId}`
}
