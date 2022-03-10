import { AuthenticationUrlConfigModel } from './authentication-url-config.model'
import { AuthenticationUrlConfigService } from './authentication-url-config.service'

const service: AuthenticationUrlConfigService = new AuthenticationUrlConfigService()

const authenticationUrlConfig: AuthenticationUrlConfigModel = {
    authentication: service.authentication,
    login: service.login,
    logout: service.logout,
    signup: service.signup,
}

export default authenticationUrlConfig
