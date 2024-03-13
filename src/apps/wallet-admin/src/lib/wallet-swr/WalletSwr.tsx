import { FC, ReactNode } from 'react'
import { SWRConfig } from 'swr'

import { xhrGetAsync } from '~/libs/core'

interface WalletSwrProps {
    children: ReactNode
}

const WalletSwr: FC<WalletSwrProps> = (props: WalletSwrProps) => (
    <SWRConfig
        value={{
            fetcher: resource => xhrGetAsync(resource),
            refreshInterval: 0,
            revalidateOnFocus: false,
            revalidateOnMount: true,
        }}
    >
        {props.children}
    </SWRConfig>
)

export default WalletSwr
