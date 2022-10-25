import { FC, ReactNode } from 'react'
import { SWRConfig } from 'swr'

import { learnXhrGetAsync } from '../functions'

interface LearnSwrProps {
    children: ReactNode
}

const LearnSwr: FC<LearnSwrProps> = (props: LearnSwrProps) => {

    return (
        <SWRConfig
            value={{
                fetcher: (resource) => learnXhrGetAsync(resource),
            }}
        >
            {props.children}
        </SWRConfig>
    )
}

export default LearnSwr
