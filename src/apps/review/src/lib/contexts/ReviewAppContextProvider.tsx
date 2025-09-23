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
import { useFetchChallengeRelativeDatas, useFetchChallengeRelativeDatasProps } from '../hooks'

export const ReviewAppContext: Context<ReviewAppContextModel>
    = createContext<ReviewAppContextModel>({
        cancelLoadChallengeRelativeInfos: noop,
        challengeRelativeInfosMapping: {},
        loadChallengeRelativeInfos: noop,
        loginUserInfo: undefined,
        resourceRoleMapping: undefined,
    })

export const ReviewAppContextProvider: FC<PropsWithChildren> = props => {
    const [loginUserInfo, setLoginUserInfo] = useState<TokenModel | undefined>(undefined)
    // fetch my resources
    const {
        cancelLoadChallengeRelativeInfos,
        loadChallengeRelativeInfos,
        challengeRelativeInfosMapping,
        resourceRoleMapping,
        resourceRoleReviewer,
        resourceRoleSubmitter,
    }: useFetchChallengeRelativeDatasProps = useFetchChallengeRelativeDatas(loginUserInfo)
    const value = useMemo(
        () => ({
            cancelLoadChallengeRelativeInfos,
            challengeRelativeInfosMapping,
            loadChallengeRelativeInfos,
            loginUserInfo,
            resourceRoleMapping,
            resourceRoleReviewer,
            resourceRoleSubmitter,
        }),
        [
            cancelLoadChallengeRelativeInfos,
            loadChallengeRelativeInfos,
            loginUserInfo,
            resourceRoleMapping,
            resourceRoleReviewer,
            resourceRoleSubmitter,
            challengeRelativeInfosMapping,
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
