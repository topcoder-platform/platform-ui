import { RouteConfig } from '../../config'

import { ToolSelectorRoute } from './tool-selector-route.model'

const routes: RouteConfig = new RouteConfig()

/* TODO: do not hard-code this here and have each app "register" itself somehow */
export const toolSelectorsRoutes: Array<ToolSelectorRoute> = [
    {
        route: routes.home,
        title: 'Home',
    },
    {
        route: routes.designLib,
        title: 'Design Library',
    },
    {
        route: routes.selfService,
        title: 'Self Service',
    },
    {
        route: routes.tool,
        title: 'Tool',
    },
]
