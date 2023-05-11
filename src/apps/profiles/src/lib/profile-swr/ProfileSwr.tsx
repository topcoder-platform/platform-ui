import { FC, ReactNode } from 'react'
import { SWRConfig } from 'swr'

import { learnXhrGetAsync } from '../functions'

interface ProfileSwrProps {
    children: ReactNode
}

const ProfileSwr: FC<ProfileSwrProps> = (props: ProfileSwrProps) => (
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

export default ProfileSwr
