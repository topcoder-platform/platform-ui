import { FetchService } from '../../../services'
import { UserProfile } from '../../user-profile.model'

import { ProfileEndpointConfig } from './profile-endpoint.config'

export class ProfileFetchStore {

    private fetchService: FetchService = new FetchService()
    private urls: ProfileEndpointConfig = new ProfileEndpointConfig()

    async get(token: string, handle: string): Promise<UserProfile> {

        const url: string = this.urls.profile(handle)
        const method: { method: string } = this.fetchService.methods.get

        const userProfileJson: Response = await this.fetchService.getFetcher(token)(url, method)
        return userProfileJson.json() || {}
    }
}
