import { EnvironmentConfig } from '~/config'

/** Return whether the admin feature can run for an explicit DEV environment/hostname; no side effects or exceptions. */
export function isMachineAccessEnabled(environment: string, hostname: string): boolean {
    return (
        ['dev', 'local'].includes(environment)
        && (hostname.endsWith('.topcoder-dev.com') || hostname === 'localhost')
    )
}

export const machineAccessEnabled: boolean = isMachineAccessEnabled(
    EnvironmentConfig.ENV,
    window.location.hostname,
)
export const machineAccessApi: string = 'https://keycloak.topcoder-dev.com/m2m/admin'
export const machineAccessTokenUrl: string = 'https://keycloak.topcoder-dev.com/m2m/token'
