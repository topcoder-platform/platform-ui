import { FC, ReactNode } from 'react'
import { SWRConfig } from 'swr'

import { xhrGetAsync } from '~/libs/core'

interface AccountsSwrProps {
    children: ReactNode
}

const AccountsSwr: FC<AccountsSwrProps> = (props: AccountsSwrProps) => (
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

export default AccountsSwr
