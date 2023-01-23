import { ReactNode } from 'react'

import { IconOutline } from '../../../../lib'
import { IconCertifSvg } from '../../learn-lib'
import { PerkIconsType, PerkItem } from '../data/perks.data'

export const iconsMap: {[key in PerkIconsType]: ReactNode} = {
    'currency-dolary': <IconOutline.CurrencyDollarIcon />,
    'filter-icon': <IconOutline.FilterIcon />,
    'icon-certif': <IconCertifSvg />,
    'shield-check': <IconOutline.ShieldCheckIcon />,
}

export function getPerkIcon(perk: PerkItem): ReactNode {
    return iconsMap[perk.icon]
}
