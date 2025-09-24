/**
 * Fetch and save user info
 */
import { useCallback, useRef, useState } from 'react'
import _ from 'lodash'

import { SearchUserInfo, UserIdType, UserMappingType } from '../models'
import { findUserById } from '../services'

export interface useLoadUserProps {
    usersMapping: UserMappingType // from user id to user handle
    loadUser: (userId: UserIdType) => void
    cancelLoadUser: () => void
    setUserFromSearch: (userHandles: SearchUserInfo[]) => void
}

/**
 * Fetch and save user info
 * @returns user info
 */
export function useLoadUser(): useLoadUserProps {
    const [usersMapping, setUsersMapping] = useState<UserMappingType>({})
    const usersMappingRef = useRef<UserMappingType>({})
    const userLoadQueue = useRef<UserIdType[]>([])
    const isLoading = useRef<boolean>(false)

    const setUserFromSearch = useCallback((userHandles: SearchUserInfo[]) => {
        if (userHandles.length > 0) {
            _.forEach(userHandles, userHandle => {
                usersMappingRef.current[`${userHandle.userId}`]
                    = userHandle.handle
            })
            setUsersMapping({
                ...usersMappingRef.current,
            })
        }
    }, [])

    const fetchNextUserInQueue = useCallback(() => {
        if (isLoading.current || !userLoadQueue.current.length) {
            return
        }

        const nextUserId = userLoadQueue.current[0]
        userLoadQueue.current = userLoadQueue.current.slice(1)
        if (usersMappingRef.current[nextUserId]) {
            fetchNextUserInQueue()
            return
        }

        isLoading.current = true
        findUserById(nextUserId)
            .then(res => {
                usersMappingRef.current[nextUserId] = res.handle
                setUsersMapping({
                    ...usersMappingRef.current,
                })
            })
            .catch(() => {
                usersMappingRef.current[
                    nextUserId
                ] = `${nextUserId} (not found)`
                setUsersMapping({
                    ...usersMappingRef.current,
                })
            })
            .finally(() => {
                isLoading.current = false
                fetchNextUserInQueue()
            })
    }, [])

    const loadUser = useCallback((userId: UserIdType) => {
        if (userId && !usersMappingRef.current[userId]) {
            userLoadQueue.current.push(userId)
            fetchNextUserInQueue()
        }
    }, [fetchNextUserInQueue])

    const cancelLoadUser = useCallback(() => {
        userLoadQueue.current = []
    }, [])

    return {
        cancelLoadUser,
        loadUser,
        setUserFromSearch,
        usersMapping,
    }
}
