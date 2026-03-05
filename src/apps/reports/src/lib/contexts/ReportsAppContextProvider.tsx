/**
 * Context provider for reports app
 */
import {
    FC,
    PropsWithChildren,
    useMemo,
    useState,
} from 'react'

import { tokenGetAsync, TokenModel } from '~/libs/core'
import { useOnComponentDidMount } from '~/apps/admin/src/lib/hooks'

import { ReportsAppContext, ReportsAppContextModel } from './ReportsAppContext'

export const ReportsAppContextProvider: FC<PropsWithChildren> = props => {
    const [loginUserInfo, setLoginUserInfo] = useState<TokenModel | undefined>(undefined)

    const value = useMemo<ReportsAppContextModel>(
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
        <ReportsAppContext.Provider value={value}>
            {props.children}
        </ReportsAppContext.Provider>
    )
}
