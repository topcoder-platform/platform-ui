import { RouteConfigModel } from './route-config.model'
import { RouteConfigService } from './route-config.service'

const service: RouteConfigService = new RouteConfigService()

const routeConfig: RouteConfigModel = {
    designLib: service.designLib,
    home: service.home,
    isActive: service.isActive,
    isHome: service.isHome,
    selfService: service.selfService,
    tool: service.tool,
}

export default routeConfig
