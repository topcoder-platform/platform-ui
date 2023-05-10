import { ReactNode } from 'react'

import { IconOutline } from '~/libs/ui'

import { IconCertifSvg } from '../../lib'
import { PerkIconsType, PerkItem } from '../certification-details-modal/certif-details-content/data'

export const iconsMap: {[key in PerkIconsType]: ReactNode} = {
    'currency-dolary': <IconOutline.CurrencyDollarIcon />,
    'filter-icon': <IconOutline.FilterIcon />,
    'icon-certif': <IconCertifSvg />,
    'shield-check': <IconOutline.ShieldCheckIcon />,
}

export function getPerkIcon(perk: PerkItem): ReactNode {
    return iconsMap[perk.icon]
}
