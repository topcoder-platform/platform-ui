import cookies from 'browser-cookies'
import { configureConnector, decodeToken, getFreshToken } from 'tc-auth-lib'

import { CookieKeys, EnvironmentConfig } from '../config'
import { AppState, AuthenticationData } from '../interfaces'
import { ExternalEndpoint } from '../urls'

import { ProfileService } from './profile.service'

export class AuthenticationService {

    private readonly externalEndpoints: ExternalEndpoint = new ExternalEndpoint()
    private readonly profiles: ProfileService = new ProfileService()

    constructor() {
        configureConnector({
            connectorUrl: this.externalEndpoints.authentication,
            frameId: 'tc-accounts-iframe',
            mockMode: undefined,
            mockToken: undefined,
        })
    }

    async authenticate(state: AppState): Promise<AppState> {

        return getFreshToken()
            .then((tctV3: string) => {
                const tctV2: string | null = cookies.get(CookieKeys.tcjwt)
                return {
                    tctV2,
                    tctV3,
                }
            })
            .catch((error: Error) => {
                // TODO: error handling
                // tslint:disable-next-line: no-console
                console.error(error)
                return {}
            })
            .then(async ({ tctV2, tctV3 }: {
                tctV2: string
                tctV3: string
            }) => {
                return this.profiles.checkAndLoadProfile(state, tctV3)
                    .then((stateData) => {
                        return {
                            stateData,
                            tctV2,
                            tctV3,
                        }
                    })
            })
            .then(({ stateData, tctV2, tctV3 }: {
                stateData: AppState,
                tctV2: string
                tctV3: string
            }) => {

                const auth: AuthenticationData = stateData.auth
                if (auth.tokenV2 !== (!!tctV2 || undefined)) {
                    stateData.auth.tokenV2 = tctV2
                }

                // we can now say that the auth is initialized
                state.auth.initialized = true

                // handle the token refresh
                this.handleRefresh(state, tctV2, tctV3)

                return stateData
            })
    }

    private handleRefresh(state: AppState, tctV2: string, tctV3: string): number {

        const userV3: { exp: number } = tctV3 ? decodeToken(tctV3) : {}

        let time: number = Number.MAX_VALUE

        // if we havea tctv2, use its expiration
        if (tctV2) {
            time = decodeToken(tctV2).exp
        }

        // if we have a userv3, take the min btwn
        // the current time and the uservl expiration
        if (userV3) {
            time = Math.min(time, userV3.exp)
        }

        if (time < Number.MAX_VALUE) {
            time = 1000 * (time - EnvironmentConfig.REAUTH_OFFSET)
            time = Math.max(0, time - Date.now())
            setTimeout(() => this.authenticate(state), time)
        }

        return time
    }
}
