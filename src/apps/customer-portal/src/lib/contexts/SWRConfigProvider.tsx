import { FC, PropsWithChildren } from 'react'
import { SWRConfig } from 'swr'

import { xhrGetAsync } from '~/libs/core'

export const SWRConfigProvider: FC<PropsWithChildren> = props => (
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

export default SWRConfigProvider
