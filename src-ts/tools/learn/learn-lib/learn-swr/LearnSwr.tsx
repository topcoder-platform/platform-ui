import { FC, ReactNode } from 'react'
import { SWRConfig } from 'swr'

import { learnXhrGetAsync } from '../functions'

interface LearnSwrProps {
    children: ReactNode
}

const LearnSwr: FC<LearnSwrProps> = (props: LearnSwrProps) => (
    <SWRConfig
        value={{
            fetcher: resource => learnXhrGetAsync(resource),
            refreshInterval: 0,
            revalidateOnFocus: false,
            revalidateOnMount: true,
        }}
    >
        {props.children}
    </SWRConfig>
)

export default LearnSwr
