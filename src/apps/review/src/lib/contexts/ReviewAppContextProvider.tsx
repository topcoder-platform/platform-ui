/**
 * Context provider for admin app
 */
import {
    Context,
    createContext,
    FC,
    PropsWithChildren,
    useMemo,
    useState,
} from 'react'
import { noop } from 'lodash'

import { tokenGetAsync, TokenModel } from '~/libs/core'
import { useOnComponentDidMount } from '~/apps/admin/src/lib/hooks'

import { ReviewAppContextModel } from '../models'
import { useFetchResource, useFetchResourceProps } from '../hooks'

export const ReviewAppContext: Context<ReviewAppContextModel>
    = createContext<ReviewAppContextModel>({
        cancelLoadMyRoleIds: noop,
        loadMyRoleIds: noop,
        loginUserInfo: undefined,
        myRoleIdsMapping: {},
        resourceRoleMapping: undefined,
    })

export const ReviewAppContextProvider: FC<PropsWithChildren> = props => {
    const [loginUserInfo, setLoginUserInfo] = useState<TokenModel | undefined>(undefined)
    const {
        cancelLoadMyRoleIds,
        loadMyRoleIds,
        myRoleIdsMapping,
        resourceRoleMapping,
    }: useFetchResourceProps = useFetchResource(loginUserInfo)
    const value = useMemo(
        () => ({
            cancelLoadMyRoleIds,
            loadMyRoleIds,
            loginUserInfo,
            myRoleIdsMapping,
            resourceRoleMapping,
        }),
        [
            cancelLoadMyRoleIds,
            loadMyRoleIds,
            loginUserInfo,
            resourceRoleMapping,
            myRoleIdsMapping,
        ],
    )

    useOnComponentDidMount(() => {
        tokenGetAsync()
            .then((token: TokenModel) => {
                setLoginUserInfo(token)
            })
    })

    return (
        <ReviewAppContext.Provider value={value}>
            {props.children}
        </ReviewAppContext.Provider>
    )
}
