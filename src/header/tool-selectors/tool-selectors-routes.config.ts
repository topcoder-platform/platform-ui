import { RouteConfig } from '../../config'

import { ToolSelectorRoute } from './tool-selector-route.model'

/* TODO: do not hard-code this here and have each app "register" itself somehow */
export const toolSelectorsRoutes: Array<ToolSelectorRoute> = [
    {
        route: RouteConfig.home,
        title: 'Home',
    },
    {
        route: RouteConfig.designLib,
        title: 'Design Library',
    },
    {
        route: RouteConfig.selfService,
        title: 'Self Service',
    },
    {
        route: RouteConfig.tool,
        title: 'Tool',
    },
]
