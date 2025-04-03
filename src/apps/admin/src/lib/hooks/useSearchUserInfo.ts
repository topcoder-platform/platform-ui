/**
 * Manage Search User Info
 */
import { useCallback, useRef, useState } from 'react'

import { SearchUserInfo } from '../models'
import { findUserById } from '../services'
import { handleError } from '../utils'

export interface useSearchUserInfoProps {
    isLoading: boolean
    doSearchUserInfo: (
        handle: string,
        onSuccess: (userInfo: SearchUserInfo) => void,
        onFail: () => void,
    ) => void
    setUserInfo: (userInfo: SearchUserInfo) => void
}

/**
 * Manage search user info
 * @returns state data
 */
export function useSearchUserInfo(): useSearchUserInfoProps {
    const [isLoading, setIsLoading] = useState(false)

    const isLoadingRef = useRef(false)
    const userInfoRef = useRef<SearchUserInfo>()

    const doSearchUserInfo = useCallback(
        (
            userId: string,
            onSuccess: (userInfo: SearchUserInfo) => void,
            onFail: () => void,
        ) => {
            if (isLoadingRef.current) {
                return
            }

            function handleErrorResult(e: any): void {
                isLoadingRef.current = false
                userInfoRef.current = undefined
                handleError(e)
                setIsLoading(false)
                onFail()
            }

            if (userId && userId !== userInfoRef.current?.userId) {
                isLoadingRef.current = true
                setIsLoading(true)

                findUserById(userId)
                    .then(rs => {
                        if (rs) {
                            isLoadingRef.current = false
                            const searchResult = {
                                handle: rs.handle,
                                userId: rs.id,
                            }
                            userInfoRef.current = searchResult
                            onSuccess(searchResult)
                            setIsLoading(false)
                        } else {
                            handleErrorResult({
                                message: `Can not find handle with id : ${userId}`,
                            })
                        }
                    })
                    .catch(handleErrorResult)
            }
        },
        [],
    )

    const setUserInfo = useCallback((userInfo: SearchUserInfo) => {
        userInfoRef.current = userInfo
    }, [])

    return {
        doSearchUserInfo,
        isLoading,
        setUserInfo,
    }
}
