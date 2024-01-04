import { FC, useContext } from 'react'

import { profileContext, ProfileContextData } from '~/libs/core'
import { LoadingSpinner } from '~/libs/ui'

import { WalletLayout } from './page-layout'

const AccountSettingsPage: FC<{}> = () => {
    const { profile, initialized }: ProfileContextData = useContext(profileContext)

    return (
        <>
            <LoadingSpinner hide={initialized} />
            {initialized && profile && <WalletLayout profile={profile} />}
        </>
    )
}

export default AccountSettingsPage
