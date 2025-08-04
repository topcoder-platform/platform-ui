/**
 * Fetch resource
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { find, reduce, toString } from 'lodash'

import { TokenModel } from '~/libs/core'
import { useOnComponentDidMount } from '~/apps/admin/src/lib/hooks'
import { handleError } from '~/libs/shared'

import {
    fetchAllMemberRoles,
    fetchAllResourceRoles,
} from '../services/resources.service'
import { BackendResourceRole, MyRoleInfosMappingType } from '../models'

export interface useFetchResourceProps {
    myRoleInfosMapping: MyRoleInfosMappingType // from challenge id to list of my role
    isLoadingResourceRoles: boolean
    resourceRoleMapping?: {
        [key: string]: BackendResourceRole
    }
    resourceRoleSubmitter?: BackendResourceRole,
    loadMyRoleInfos: (challengeId: string) => void
    cancelLoadMyRoleInfos: () => void
}

/**
 * Fetch resources
 * @returns resources
 */
export function useFetchResource(
    loginUserInfo: TokenModel | undefined,
): useFetchResourceProps {
    const [myRoleInfosMapping, setMyRoleInfosMapping]
        = useState<MyRoleInfosMappingType>({})
    const [isLoadingResourceRoles, setIsLoadingResourceRoles] = useState(false)
    const [resourceRoleMapping, setResourceRoleMapping] = useState<{
        [key: string]: BackendResourceRole
    }>()
    const [resourceRoleSubmitter, setResourceRoleSubmitter] = useState<BackendResourceRole>()
    const myRoleInfosMappingRef = useRef<MyRoleInfosMappingType>({})
    const myRoleInfosLoadQueue = useRef<string[]>([])
    const isLoadingMyRole = useRef<boolean>(false)

    useOnComponentDidMount(() => {
        setIsLoadingResourceRoles(true)
        // fetch all resource roles on init
        fetchAllResourceRoles()
            .then(results => {
                setResourceRoleSubmitter(find(results.data, {
                    name: 'Submitter',
                }))
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

    /**
     * Check to fetch my roles infos in queue
     */
    const fetchNextMyRoleInfosInQueue = useCallback(() => {
        if (
            isLoadingMyRole.current
            || !myRoleInfosLoadQueue.current.length
            || !loginUserInfo
        ) {
            return
        }

        const nextMyRoleInfosId = myRoleInfosLoadQueue.current[0]
        myRoleInfosLoadQueue.current = myRoleInfosLoadQueue.current.slice(1)
        if (myRoleInfosMappingRef.current[nextMyRoleInfosId]) {
            fetchNextMyRoleInfosInQueue()
            return
        }

        isLoadingMyRole.current = true
        // Fetch all member roles for special challenge
        fetchAllMemberRoles(nextMyRoleInfosId, toString(loginUserInfo.userId))
            .then(res => {
                myRoleInfosMappingRef.current[nextMyRoleInfosId]
                    = res.data.filter(
                        item => item.memberId === toString(loginUserInfo.userId),
                    )
                setMyRoleInfosMapping({
                    ...myRoleInfosMappingRef.current,
                })
            })
            .catch(() => {
                myRoleInfosMappingRef.current[nextMyRoleInfosId] = []
                setMyRoleInfosMapping({
                    ...myRoleInfosMappingRef.current,
                })
            })
            .finally(() => {
                isLoadingMyRole.current = false
                fetchNextMyRoleInfosInQueue()
            })
    }, [loginUserInfo])

    /**
     * Add new challenge id to loading queue
     */
    const loadMyRoleInfos = useCallback(
        (challengeId: string) => {
            if (challengeId && !myRoleInfosMappingRef.current[challengeId]) {
                myRoleInfosLoadQueue.current.push(challengeId)
                fetchNextMyRoleInfosInQueue()
            }
        },
        [fetchNextMyRoleInfosInQueue, loginUserInfo],
    )

    /**
     * Cancel load my role infos queue
     */
    const cancelLoadMyRoleInfos = useCallback(() => {
        myRoleInfosLoadQueue.current = []
    }, [])

    useEffect(() => {
        fetchNextMyRoleInfosInQueue()
    }, [loginUserInfo])

    return {
        cancelLoadMyRoleInfos,
        isLoadingResourceRoles,
        loadMyRoleInfos,
        myRoleInfosMapping,
        resourceRoleMapping,
        resourceRoleSubmitter,
    }
}
