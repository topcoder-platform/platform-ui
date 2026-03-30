import {
    FC,
    PropsWithChildren,
    useMemo,
    useState,
} from 'react'

import { useOnComponentDidMount } from '~/apps/admin/src/lib/hooks'
import { TokenModel } from '~/libs/core'

import {
    ADMIN_ROLES,
    COPILOT_ROLES,
    MANAGER_ROLES,
    READ_ONLY_ROLES,
} from '../../config/index.config'
import { WorkAppContextModel } from '../models'
import { refreshAuthTokenAsync } from '../utils/auth.utils'

import { WorkAppContext } from './WorkAppContext'

function normalizeRoles(roles: string[] = []): string[] {
    return roles.map(role => role.toLowerCase())
}

export const WorkAppContextProvider: FC<PropsWithChildren> = props => {
    const [loginUserInfo, setLoginUserInfo] = useState<TokenModel | undefined>(undefined)

    const userRoles = useMemo<string[]>(() => normalizeRoles(loginUserInfo?.roles), [loginUserInfo?.roles])

    const isAnonymous = useMemo<boolean>(
        () => !loginUserInfo || !userRoles.length,
        [loginUserInfo, userRoles.length],
    )

    const isAdmin = useMemo<boolean>(
        () => userRoles.some(role => ADMIN_ROLES.includes(role)),
        [userRoles],
    )

    const isCopilot = useMemo<boolean>(
        () => userRoles.some(role => COPILOT_ROLES.includes(role)),
        [userRoles],
    )

    const isManager = useMemo<boolean>(
        () => userRoles.some(role => MANAGER_ROLES.includes(role)),
        [userRoles],
    )

    const isReadOnly = useMemo<boolean>(
        () => userRoles.some(role => READ_ONLY_ROLES.includes(role)),
        [userRoles],
    )

    const value = useMemo<WorkAppContextModel>(
        () => ({
            isAdmin,
            isAnonymous,
            isCopilot,
            isManager,
            isReadOnly,
            loginUserInfo,
            userRoles,
        }),
        [isAdmin, isAnonymous, isCopilot, isManager, isReadOnly, loginUserInfo, userRoles],
    )

    useOnComponentDidMount(() => {
        refreshAuthTokenAsync()
            .then((token: TokenModel | undefined) => {
                setLoginUserInfo(token)
            })
            .catch(() => {
                setLoginUserInfo(undefined)
            })
    })

    return (
        <WorkAppContext.Provider value={value}>
            {props.children}
        </WorkAppContext.Provider>
    )
}
