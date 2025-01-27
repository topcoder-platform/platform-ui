import { configureConnector, decodeToken, getFreshToken } from 'tc-auth-lib'
import cookies from 'browser-cookies'

import { EnvironmentConfig, ToolTitle } from '~/config'

import { PlatformRoute } from '../../router'
import { logError } from '../../logger'

import { AuthenticationRegistrationSource } from './authentication-reg-source.enum'
import { authentication as authenticationUrl } from './authentication-url.config'
import { CookieKeys } from './cookie-keys.enum'
import { AuthUser } from './auth-user.model'

interface TokenData {
    tokenV2?: string
    tokenV3?: string
}

configureConnector({
    connectorUrl: authenticationUrl,
    frameId: 'tc-accounts-iframe',
    mockMode: undefined,
    mockToken: undefined,
})

export function getRegistrationSource(
    activeTool: PlatformRoute | undefined,
): AuthenticationRegistrationSource | undefined {

    switch (activeTool?.id) {

        // currently, there is no reg source for members
        case ToolTitle.tcAcademy:
            return undefined

        // currently, the work tool and the platform
        // landing page use the reg source of selfService
        default:
            return AuthenticationRegistrationSource.work
    }
}

export async function initializeAsync(): Promise<string | undefined> {
    return getFreshToken()
        .then((tokenV3: string) => {
            const tokenV2: string | null = cookies.get(CookieKeys.tcjwt)
            return {
                tokenV2,
                tokenV3,
            }
        })
        .catch((error: Error) => {
            logError(error?.message || `${error}` || 'unknown error getting authentication token')
            return {}
        })
        .then((token: TokenData) => {
            handleRefresh(token)
            return token.tokenV3
        })
}

function handleRefresh(token: TokenData): number {

    let time: number = Number.MAX_VALUE

    const user: AuthUser = !!token.tokenV3 ? decodeToken(token.tokenV3) : {}

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
        setTimeout(() => initializeAsync(), time)
    }

    return time
}
