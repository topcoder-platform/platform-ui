/**
 * Fetch and save group info
 */

import { useCallback, useRef, useState } from 'react'
import _ from 'lodash'

import { SelectOption, UserIdType, UserMappingType } from '../models'
import { findGroupById } from '../services'

export interface useLoadGroupProps {
    groupsMapping: UserMappingType // from group id to group handle
    loadGroup: (groupId: UserIdType) => void
    cancelLoadGroup: () => void
    setGroupFromSearch: (options: SelectOption[]) => void
}

/**
 * Fetch and save group info
 * @returns group info
 */
export function useLoadGroup(): useLoadGroupProps {
    const [groupsMapping, setGroupsMapping] = useState<UserMappingType>({})
    const groupsMappingRef = useRef<UserMappingType>({})
    const groupLoadQueue = useRef<UserIdType[]>([])
    const isLoading = useRef<boolean>(false)

    const setGroupFromSearch = useCallback((options: SelectOption[]) => {
        if (options.length > 0) {
            _.forEach(options, option => {
                groupsMappingRef.current[option.label] = option.value as string
            })
            setGroupsMapping({
                ...groupsMappingRef.current,
            })
        }
    }, [])

    const fetchNextGroupInQueue = useCallback(() => {
        if (isLoading.current || !groupLoadQueue.current.length) {
            return
        }

        const nextGroupId = groupLoadQueue.current[0]
        groupLoadQueue.current = groupLoadQueue.current.slice(1)
        if (groupsMappingRef.current[nextGroupId]) {
            fetchNextGroupInQueue()
            return
        }

        isLoading.current = true
        findGroupById(`${nextGroupId}`)
            .then(res => {
                groupsMappingRef.current[nextGroupId] = res.name
                setGroupsMapping({
                    ...groupsMappingRef.current,
                })
            })
            .catch(() => {
                groupsMappingRef.current[
                    nextGroupId
                ] = `${nextGroupId} (not found)`
                setGroupsMapping({
                    ...groupsMappingRef.current,
                })
            })
            .finally(() => {
                isLoading.current = false
                fetchNextGroupInQueue()
            })
    }, [])

    const loadGroup = useCallback((groupId: UserIdType) => {
        if (groupId && !groupsMappingRef.current[groupId]) {
            groupLoadQueue.current.push(groupId)
            fetchNextGroupInQueue()
        }
    }, [fetchNextGroupInQueue])

    const cancelLoadGroup = useCallback(() => {
        groupLoadQueue.current = []
    }, [])

    return {
        cancelLoadGroup,
        groupsMapping,
        loadGroup,
        setGroupFromSearch,
    }
}
