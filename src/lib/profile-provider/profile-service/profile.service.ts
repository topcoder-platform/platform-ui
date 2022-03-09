import { decodeToken } from 'tc-auth-lib'

import { AuthenticationService } from '../../services/authentication-service'
import { LoggingService } from '../../services/logging-service'
import { UserProfile } from '../user-profile.model'

import { ProfileFetchStore } from './profile-store'

export class ProfileService {

    private readonly authenticationService: AuthenticationService = new AuthenticationService()
    private readonly loggingService: LoggingService = new LoggingService()
    private readonly profileFetchStore: ProfileFetchStore = new ProfileFetchStore()

    async get(): Promise<UserProfile | undefined> {

        const token: string | undefined = await this.authenticationService.authenticate()

        // if there is no token, don't try to get a profile
        if (!token) {
            return Promise.resolve(undefined)
        }

        try {
            const { handle }: { handle?: string } = decodeToken(token)

            // if we didn't find the handle, we can't get the profile
            if (!handle) {
                this.loggingService.logInfo(`token did not have a handle: ${token}`)
                return Promise.resolve(undefined)
            }

            return this.profileFetchStore.get(token, handle)

        } catch (error: any) {
            this.loggingService.logError(error)
            return Promise.resolve(undefined)
        }
    }
}
