import { ReactNode } from 'react'

import { FccLogoBlackSvg, TcaProviderType, TcLogoSvg } from '../../learn-lib'

export const providersLogoMap: {[key in TcaProviderType]: ReactNode} = {
    freecodecamp: <FccLogoBlackSvg />,
    topcoder: <TcLogoSvg />,
}

export function getProviderLogo(provider: TcaProviderType): ReactNode {
    return providersLogoMap[provider]
}
