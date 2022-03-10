import { ProfileRouteConfigModel } from './profile-routes-config.model'
import { ProfileRouteConfigService } from './profile-routes-config.service'

const service: ProfileRouteConfigService = new ProfileRouteConfigService()

const profileRoutesConfig: ProfileRouteConfigModel = {
    profile: service.profile,
}

export default profileRoutesConfig
