import { FetchService } from '../../services'
import { UserProfile } from '../models'

import { ProfileEndpointConfig } from './config'

export class ProfileFetchStore {

    private fetchService: FetchService = new FetchService()
    private urls: ProfileEndpointConfig = new ProfileEndpointConfig()

    get(userTokenV3: string, handle: string): Promise<UserProfile> {

        const url: string = this.urls.profile(handle)
        const method: { method: string } = this.fetchService.methods.get

        return this.fetchService.getFetcher(userTokenV3)(url, method)
            .then((res) => res.json() || {})
    }
}
