import { FC, ReactNode } from 'react'
import { SWRConfig } from 'swr'

import { xhrGetAsync } from '~/libs/core'

interface ProfileSwrProps {
    children: ReactNode
}

const ProfileSwr: FC<ProfileSwrProps> = (props: ProfileSwrProps) => (
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

export default ProfileSwr
