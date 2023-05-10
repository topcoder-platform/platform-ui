import { ReactNode } from 'react'

import { FccLogoBlackSvg, TcLogoSvg } from '../svgs'
import { TCAProviderType } from '../../data-providers'

export const providersLogoMap: {[key in TCAProviderType]: ReactNode} = {
    freeCodeCamp: <FccLogoBlackSvg />,
    Topcoder: <TcLogoSvg />,
}

export function getProviderLogo(provider: TCAProviderType): ReactNode {
    return providersLogoMap[provider]
}
