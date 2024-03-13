import { FC, useContext } from 'react'

import { profileContext, ProfileContextData } from '~/libs/core'
import { LoadingSpinner } from '~/libs/ui'

import { WalletAdminLayout } from './page-layout'

const AccountSettingsPage: FC<{}> = () => {
    const { profile, initialized }: ProfileContextData = useContext(profileContext)

    return (
        <>
            <LoadingSpinner hide={initialized} />
            {initialized && profile && <WalletAdminLayout profile={profile} />}
        </>
    )
}

export default AccountSettingsPage
