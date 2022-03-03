import { SectionSelectorProps } from '../../../lib'
import chatIcon from '../../../lib/svg/chat.svg'
import mailIcon from '../../../lib/svg/mail.svg'
import ticketIcon from '../../../lib/svg/ticket.svg'

import { DesignLibRouteConfig } from './design-lib-route.config'

const routes: DesignLibRouteConfig = new DesignLibRouteConfig()

export const sections: Array<SectionSelectorProps> = [
    {
        icon: mailIcon,
        route: routes.root,
        title: 'Home',
    },
    {
        icon: ticketIcon,
        route: routes.buttons,
        title: 'Buttons',
    },
    {
        icon: chatIcon,
        route: routes.fonts,
        title: 'Fonts',
    },
    {
        icon: mailIcon,
        route: routes.icons,
        title: 'Icons',
    },
]
