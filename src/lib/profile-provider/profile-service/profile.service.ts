import { decodeToken } from 'tc-auth-lib'

import { AuthenticationService } from '../../services/authentication-service'
import { UserProfile } from '../user-profile.model'

import { ProfileFetchStore } from './profile-store'

export class ProfileService {

    private authenticationService: AuthenticationService = new AuthenticationService()
    private profileFetchStore: ProfileFetchStore = new ProfileFetchStore()

    async get(): Promise<UserProfile | undefined> {

        const tokenRaw: string | undefined = await this.authenticationService.authenticate()

        // if there is no user, unset the profile and don't try to get it
        if (!tokenRaw) {
            return Promise.resolve(undefined)
        }

        try {
            const { handle, tokenV3 }: {
                handle?: string
                tokenV3?: string
            } = decodeToken(tokenRaw)

            if (!tokenV3 || !handle) {
                return Promise.resolve(undefined)
            }

            return this.profileFetchStore.get(tokenV3, handle)

        } catch {
            // TODO: log error
            return Promise.resolve(undefined)
        }
    }
}
