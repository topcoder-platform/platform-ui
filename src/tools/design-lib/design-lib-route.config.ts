import { DesignLibRouteConfigModel } from './design-lib-route-config.model'
import { DesignLibRouteConfigService } from './design-lib-route-config.service'

const service: DesignLibRouteConfigService = new DesignLibRouteConfigService()

const designLibRouteConfig: DesignLibRouteConfigModel = {
    buttons: service.buttons,
    fonts: service.fonts,
    home: service.home,
    icons: service.icons,
    rooted: service.rooted,
}

export default designLibRouteConfig
