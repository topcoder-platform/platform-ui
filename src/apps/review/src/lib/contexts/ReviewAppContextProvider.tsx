/**
 * Context provider for review app
 */
import {
    FC,
    PropsWithChildren,
    useMemo,
    useState,
} from 'react'

import { tokenGetAsync, TokenModel } from '~/libs/core'
import { useOnComponentDidMount } from '~/apps/admin/src/lib/hooks'

import { useFetchChallengeRelativeDatas } from '../hooks'
import type { useFetchChallengeRelativeDatasProps } from '../hooks'
import type { ReviewAppContextModel } from '../models'

import { ReviewAppContext } from './ReviewAppContext'

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
    const value = useMemo<ReviewAppContextModel>(
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
