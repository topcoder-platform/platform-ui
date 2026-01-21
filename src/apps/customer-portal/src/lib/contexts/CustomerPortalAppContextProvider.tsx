/**
 * Context provider for customer portal app
 */
import {
    FC,
    PropsWithChildren,
    useMemo,
    useState,
} from 'react'

import { tokenGetAsync, TokenModel } from '~/libs/core'
import { useOnComponentDidMount } from '~/apps/admin/src/lib/hooks'

import type { CustomerPortalAppContextModel } from '../models'

import { CustomerPortalAppContext } from './CustomerPortalAppContext'

export const CustomerPortalAppContextProvider: FC<PropsWithChildren> = props => {
    const [loginUserInfo, setLoginUserInfo] = useState<TokenModel | undefined>(undefined)

    const value = useMemo<CustomerPortalAppContextModel>(
        () => ({
            loginUserInfo,
        }),
        [
            loginUserInfo,
        ],
    )

    useOnComponentDidMount(() => {
        // get login user info on init
        tokenGetAsync()
            .then((token: TokenModel) => {
                setLoginUserInfo(token)
            })
    })

    return (
        <CustomerPortalAppContext.Provider value={value}>
            {props.children}
        </CustomerPortalAppContext.Provider>
    )
}
