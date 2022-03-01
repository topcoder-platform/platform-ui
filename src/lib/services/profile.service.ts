import { decodeToken } from 'tc-auth-lib'

// TODO: add User to tc-auth-lib
import { User } from '../../../types/tc-auth-lib'
import { AppState, UserProfile } from '../interfaces'
import { ApiEndoint } from '../urls'

export class ProfileService {

    private readonly apiEndpoints: ApiEndoint = new ApiEndoint()

    checkAndLoadProfile(state: AppState, tctV3: string): Promise<AppState> {

        // if there is no new token, we have a problem,
        // so unset the profile and don't try to get it
        if (!tctV3) {
            state.profile = undefined
            return Promise.resolve(state)
        }

        // if the state's token already matches the new token
        // and the profile exists on the state,
        // there's no need to get the profile again
        if (state.auth.tokenV3 === tctV3 && !!state.profile) {
            return Promise.resolve(state)
        }

        // now we get the profile
        return this.loadProfile(tctV3)
            // even if error happens, call `loadProfile` action and set profile as `null`
            .catch((err: Error) => {
                // tslint:disable-next-line: no-console
                console.error(err)
                return undefined
            })
            .then((profile) => {
                state.profile = profile
                state.auth.tokenV3 = tctV3
                state.auth.user = profile?.handle
                return state
            })
    }

    private getFetcher(token: string): (endpoint: string, options: RequestInit) => Promise<Response> {

        const fetcher: (endpoint: string, options: RequestInit) => Promise<Response> = (endpoint: string, options: RequestInit = {}) => {

            const headers: any = options.headers ? { ...options.headers } : {}

            if (token) {
                headers.Authorization = `Bearer ${token}`
            }

            const contentTypeKey: string = 'Content-Type'
            switch (headers[contentTypeKey]) {
                // tslint:disable-next-line: no-null-keyword
                case null:
                    delete headers[contentTypeKey]
                    break
                case undefined:
                    headers[contentTypeKey] = 'application/json'
                    break
                default:
            }

            return fetch(`${endpoint}`, {
                ...options,
                headers,
            })
        }

        return fetcher
    }

    private loadProfile(userTokenV3: string): Promise<UserProfile | undefined> {

        // if we don't have a user token, there's nothing we can do to get the profile
        if (!userTokenV3) {
            return Promise.resolve(undefined)
        }

        // if we can't decode the token, we have a problem
        const user: User = decodeToken(userTokenV3)
        if (!user) {
            return Promise.resolve(undefined)
        }

        const url: string = this.apiEndpoints.profile(user.handle)
        const method: { method: string } = { method: 'get' }

        return this.getFetcher(userTokenV3)(url, method)
            .then((res) => res.json() || {})
    }
}
