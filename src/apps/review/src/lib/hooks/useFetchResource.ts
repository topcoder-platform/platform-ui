/**
 * Fetch resource
 */
import { useCallback, useRef, useState } from 'react'
import { reduce, toString } from 'lodash'

import { TokenModel } from '~/libs/core'
import { useOnComponentDidMount } from '~/apps/admin/src/lib/hooks'
import { handleError } from '~/libs/shared'

import {
    fetchAllMemberRoles,
    fetchAllResourceRoles,
} from '../services/resources.service'
import { BackendResourceRole, MyRoleIdsMappingType } from '../models'

export interface useFetchResourceProps {
    myRoleIdsMapping: MyRoleIdsMappingType // from challenge id to list of my role
    isLoadingResourceRoles: boolean
    resourceRoleMapping?: {
        [key: string]: BackendResourceRole
    }
    loadMyRoleIds: (challengeId: string) => void
    cancelLoadMyRoleIds: () => void
}

/**
 * Fetch resources
 * @returns resources
 */
export function useFetchResource(
    loginUserInfo: TokenModel | undefined,
): useFetchResourceProps {
    const [myRoleIdsMapping, setMyRoleIdsMapping]
        = useState<MyRoleIdsMappingType>({})
    const [isLoadingResourceRoles, setIsLoadingResourceRoles] = useState(false)
    const [resourceRoleMapping, setResourceRoleMapping] = useState<{
        [key: string]: BackendResourceRole
    }>()
    const myRoleIdsMappingRef = useRef<MyRoleIdsMappingType>({})
    const myRoleIdsLoadQueue = useRef<string[]>([])
    const isLoadingMyRole = useRef<boolean>(false)

    useOnComponentDidMount(() => {
        setIsLoadingResourceRoles(true)
        fetchAllResourceRoles()
            .then(results => {
                setResourceRoleMapping(
                    reduce(
                        results.data,
                        (mappingResult, resourceRole: BackendResourceRole) => ({
                            ...mappingResult,
                            [resourceRole.id]: resourceRole,
                        }),
                        {},
                    ),
                )
                setIsLoadingResourceRoles(false)
            })
            .catch(e => {
                handleError(e)
                setIsLoadingResourceRoles(false)
            })
    })

    const fetchNextMyRoleIdsInQueue = useCallback(() => {
        if (
            isLoadingMyRole.current
            || !myRoleIdsLoadQueue.current.length
            || !loginUserInfo
        ) {
            return
        }

        const nextMyRoleIdsId = myRoleIdsLoadQueue.current[0]
        myRoleIdsLoadQueue.current = myRoleIdsLoadQueue.current.slice(1)
        if (myRoleIdsMappingRef.current[nextMyRoleIdsId]) {
            fetchNextMyRoleIdsInQueue()
            return
        }

        isLoadingMyRole.current = true
        fetchAllMemberRoles(nextMyRoleIdsId, toString(loginUserInfo.userId))
            .then(res => {
                myRoleIdsMappingRef.current[nextMyRoleIdsId] = res.data.map(
                    item => item.roleId,
                )
                setMyRoleIdsMapping({
                    ...myRoleIdsMappingRef.current,
                })
            })
            .catch(() => {
                myRoleIdsMappingRef.current[nextMyRoleIdsId] = ['not found']
                setMyRoleIdsMapping({
                    ...myRoleIdsMappingRef.current,
                })
            })
            .finally(() => {
                isLoadingMyRole.current = false
                fetchNextMyRoleIdsInQueue()
            })
    }, [loginUserInfo])

    const loadMyRoleIds = useCallback(
        (challengeId: string) => {
            if (challengeId && !myRoleIdsMappingRef.current[challengeId]) {
                myRoleIdsLoadQueue.current.push(challengeId)
                fetchNextMyRoleIdsInQueue()
            }
        },
        [fetchNextMyRoleIdsInQueue, loginUserInfo],
    )

    const cancelLoadMyRoleIds = useCallback(() => {
        myRoleIdsLoadQueue.current = []
    }, [])

    return {
        cancelLoadMyRoleIds,
        isLoadingResourceRoles,
        loadMyRoleIds,
        myRoleIdsMapping,
        resourceRoleMapping,
    }
}
