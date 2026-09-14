import { ComponentType, SVGProps } from 'react'

import { IconOutline } from '~/libs/ui'
import { topScoutRouteId } from '~/apps/customer-portal/src/config/routes.config'

export interface AssistantConfigItem {
    id: string
    title: string
    description: string
    icon: ComponentType<SVGProps<SVGSVGElement>>
}

export const assistantsConfig: AssistantConfigItem[] = [
    {
        description: 'Challenge-driven search and navigation. Filter by technical and business '
            + 'specs at the challenge level, view parent project details, and connect with '
            + 'related engagements and members.',
        icon: IconOutline.SearchIcon,
        id: topScoutRouteId,
        title: 'TopScout',
    },
]
