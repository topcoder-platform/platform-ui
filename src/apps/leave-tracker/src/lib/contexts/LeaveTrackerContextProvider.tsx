import {
    FC,
    PropsWithChildren,
    useEffect,
    useMemo,
    useState,
} from 'react'

import { tokenGetAsync, TokenModel } from '~/libs/core'

import type { LeaveTrackerContextModel } from '../models'

import { LeaveTrackerContext } from './LeaveTrackerContext'

export const LeaveTrackerContextProvider: FC<PropsWithChildren> = props => {
    const [loginUserInfo, setLoginUserInfo] = useState<TokenModel | undefined>(undefined)

    const value = useMemo<LeaveTrackerContextModel>(
        () => ({
            loginUserInfo,
        }),
        [loginUserInfo],
    )

    useEffect(() => {
        tokenGetAsync()
            .then((token: TokenModel) => setLoginUserInfo(token))
            .catch(() => {
                // no-op, consumer can handle missing token
            })
    }, [])

    return (
        <LeaveTrackerContext.Provider value={value}>
            {props.children}
        </LeaveTrackerContext.Provider>
    )
}

export default LeaveTrackerContextProvider
