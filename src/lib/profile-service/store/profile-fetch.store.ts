import { FetchService } from '../../fetch-service'
import { UserProfile } from '../models'

import { ProfileUrlConfig } from './config'

export class ProfileFetchStore {

    private fetchService: FetchService = new FetchService()
    private urls: ProfileUrlConfig = new ProfileUrlConfig()

    get(userTokenV3: string, handle: string): Promise<UserProfile> {

        const url: string = this.urls.profile(handle)
        const method: { method: string } = this.fetchService.methods.get

        return this.fetchService.getFetcher(userTokenV3)(url, method)
            .then((res) => res.json() || {})
    }
}
