/**
 * Context provider for review app
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
        cancelLoadMyRoleInfos: noop,
        loadMyRoleInfos: noop,
        loginUserInfo: undefined,
        myRoleInfosMapping: {},
        resourceRoleMapping: undefined,
    })

export const ReviewAppContextProvider: FC<PropsWithChildren> = props => {
    const [loginUserInfo, setLoginUserInfo] = useState<TokenModel | undefined>(undefined)
    // fetch my resources
    const {
        cancelLoadMyRoleInfos,
        loadMyRoleInfos,
        myRoleInfosMapping,
        resourceRoleMapping,
        resourceRoleSubmitter,
    }: useFetchResourceProps = useFetchResource(loginUserInfo)
    const value = useMemo(
        () => ({
            cancelLoadMyRoleInfos,
            loadMyRoleInfos,
            loginUserInfo,
            myRoleInfosMapping,
            resourceRoleMapping,
            resourceRoleSubmitter,
        }),
        [
            cancelLoadMyRoleInfos,
            loadMyRoleInfos,
            loginUserInfo,
            resourceRoleMapping,
            resourceRoleSubmitter,
            myRoleInfosMapping,
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
        <ReviewAppContext.Provider value={value}>
            {props.children}
        </ReviewAppContext.Provider>
    )
}
