import { FC, useContext } from 'react'

import { profileContext, ProfileContextData } from '~/libs/core'
import { LoadingSpinner } from '~/libs/ui'

import { canAccessWalletAdmin } from '../config/access.config'
import RoleErrorPage from '../pages/role-error/RoleErrorPage'

import { WalletAdminLayout } from './page-layout'

const AccountSettingsPage: FC<{}> = () => {
    const { profile, initialized }: ProfileContextData = useContext(profileContext)

    return (
        <>
            <LoadingSpinner hide={initialized} />
            {initialized && profile && (
                canAccessWalletAdmin(profile.roles)
                    ? <WalletAdminLayout profile={profile} />
                    : <RoleErrorPage />
            )}
        </>
    )
}

export default AccountSettingsPage
