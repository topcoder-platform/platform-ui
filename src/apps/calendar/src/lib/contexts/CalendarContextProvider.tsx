import {
    FC,
    PropsWithChildren,
    useEffect,
    useMemo,
    useState,
} from 'react'

import { tokenGetAsync, TokenModel } from '~/libs/core'

import type { CalendarContextModel } from '../models'

import { CalendarContext } from './CalendarContext'

export const CalendarContextProvider: FC<PropsWithChildren> = props => {
    const [loginUserInfo, setLoginUserInfo] = useState<TokenModel | undefined>(undefined)

    const value = useMemo<CalendarContextModel>(
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
        <CalendarContext.Provider value={value}>
            {props.children}
        </CalendarContext.Provider>
    )
}

export default CalendarContextProvider
