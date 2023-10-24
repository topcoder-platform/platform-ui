import { FC, useContext } from 'react'

import { profileContext, ProfileContextData } from '~/libs/core'
import { LoadingSpinner } from '~/libs/ui'

import { AccountSettingsLayout } from './page-layout'

const AccountSettingsPage: FC<{}> = () => {
    const { profile, initialized: profileReady }: ProfileContextData = useContext(profileContext)

    return (
        <>
            <LoadingSpinner hide={profileReady} />

            {profileReady && profile && (
                <AccountSettingsLayout
                    profile={profile}
                />
            )}
        </>
    )
}

export default AccountSettingsPage
