import { FC, ReactNode } from 'react'
import { SWRConfig } from 'swr'
import { xhrGetAsync } from '~/libs/core'

interface EngagementsSwrProps {
    children: ReactNode
}

const EngagementsSwr: FC<EngagementsSwrProps> = (props: EngagementsSwrProps) => (
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

export default EngagementsSwr
