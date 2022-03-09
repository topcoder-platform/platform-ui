import cookies from 'browser-cookies'
import { configureConnector, decodeToken, getFreshToken } from 'tc-auth-lib'

import { User } from '../../../../types/tc-auth-lib'
import { EnvironmentConfig } from '../../../config'
import { LoggingService } from '../logging-service'

import { AuthenticationUrlConfig } from './authentication-url.config'
import { CookieKeys } from './cookie-keys.enum'

interface TokenData {
    tokenV2?: string
    tokenV3?: string
}

export class AuthenticationService {

    private readonly externalEndpoints: AuthenticationUrlConfig = new AuthenticationUrlConfig()
    private readonly loggingService: LoggingService = new LoggingService()

    constructor() {
        configureConnector({
            connectorUrl: this.externalEndpoints.authentication,
            frameId: 'tc-accounts-iframe',
            mockMode: undefined,
            mockToken: undefined,
        })
    }

    async authenticate(): Promise<string | undefined> {

        return getFreshToken()
            .then((tokenV3: string) => {
                const tokenV2: string | null = cookies.get(CookieKeys.tcjwt)
                return {
                    tokenV2,
                    tokenV3,
                }
            })
            .catch((error: Error) => {
                this.loggingService.logError(error?.message || `${error}` || 'unknown error getting authentication token')
                return {}
            })
            .then((token: TokenData) => {
                this.handleRefresh(token)
                return token.tokenV3
            })
    }

    private handleRefresh(token: TokenData): number {

        let time: number = Number.MAX_VALUE

        const user: User = !!token.tokenV3 ? decodeToken(token.tokenV3) : {}

        // if we havea tctv2, use its expiration
        if (!!token.tokenV2) {
            time = decodeToken(token.tokenV2).exp
        }

        // if we have a user, take the min btwn
        // the current time and the uservl expiration
        if (!!user.exp) {
            time = Math.min(time, user.exp)
        }

        if (time < Number.MAX_VALUE) {
            time = 1000 * (time - EnvironmentConfig.REAUTH_OFFSET)
            time = Math.max(0, time - Date.now())
            setTimeout(() => this.authenticate(), time)
        }

        return time
    }
}
