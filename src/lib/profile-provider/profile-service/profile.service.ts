import { decodeToken } from 'tc-auth-lib'

import { AuthenticationService } from '../../services/authentication-service'
import { UserProfile } from '../user-profile.model'

import { ProfileFetchStore } from './profile-store'

export class ProfileService {

    private authenticationService: AuthenticationService = new AuthenticationService()
    private profileFetchStore: ProfileFetchStore = new ProfileFetchStore()

    async get(): Promise<UserProfile | undefined> {

        const token: string | undefined = await this.authenticationService.authenticate()

        // if there is no token, don't try to get a profile
        if (!token) {
            return Promise.resolve(undefined)
        }

        try {
            const { handle }: { handle?: string } = decodeToken(token)

            // if we didn't find the handle, we can't get the profile
            // TODO: this is probably an error that should be thrown in the bg
            // b/c it means we have a corrupt token for some reason
            if (!handle) {
                return Promise.resolve(undefined)
            }

            return this.profileFetchStore.get(token, handle)

        } catch {
            // TODO: log error
            return Promise.resolve(undefined)
        }
    }
}
