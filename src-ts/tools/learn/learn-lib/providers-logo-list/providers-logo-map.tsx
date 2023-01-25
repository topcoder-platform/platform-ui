import { ReactNode } from 'react'

import { TcaProviderType } from '../data-providers'
import { FccLogoBlackSvg, TcLogoSvg } from '../svgs'

export const providersLogoMap: {[key in TcaProviderType]: ReactNode} = {
    freecodecamp: <FccLogoBlackSvg />,
    topcoder: <TcLogoSvg />,
}

export function getProviderLogo(provider: TcaProviderType): ReactNode {
    return providersLogoMap[provider]
}
