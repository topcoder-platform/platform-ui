import { FC, ReactNode } from 'react'
import { SWRConfig } from 'swr'

import { xhrGetAsync } from '~/libs/core'

interface SwrConfigProps {
    children: ReactNode
}

const SwrConfig: FC<SwrConfigProps> = (props: SwrConfigProps) => (
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

export default SwrConfig
