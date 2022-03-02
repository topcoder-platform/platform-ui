import { UiRoute } from '../../../lib'
import { ToolSelectorProps } from '../models'

const routes: UiRoute = new UiRoute()

export const toolSelectors: Array<ToolSelectorProps> = [
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
