import { ProfileEndpointConfigModel } from './profile-endpoint-config.model'
import { ProfileEndpointConfigService } from './profile-endpoint-config.service'

const service: ProfileEndpointConfigService = new ProfileEndpointConfigService()

const profileEndpointConfig: ProfileEndpointConfigModel = {
    profile: service.profile,
}

export default profileEndpointConfig
