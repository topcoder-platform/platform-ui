import {
    useCallback,
    useState,
} from 'react'

import {
    GroupBulkCreatePayload,
    GroupBulkCreateResponse,
} from '../models'
import { bulkCreateGroup as bulkCreateGroupService } from '../services'
import {
    showErrorToast,
    showSuccessToast,
} from '../utils'

function normalizeError(error: unknown, fallbackMessage: string): Error {
    if (error instanceof Error && error.message.trim()) {
        return error
    }

    return new Error(fallbackMessage)
}

export interface UseBulkCreateGroupResult {
    createGroup: (payload: GroupBulkCreatePayload) => Promise<GroupBulkCreateResponse | undefined>
    createdGroup: GroupBulkCreateResponse | undefined
    error: Error | undefined
    isCreating: boolean
}

export function useBulkCreateGroup(): UseBulkCreateGroupResult {
    const [createdGroup, setCreatedGroup] = useState<GroupBulkCreateResponse | undefined>(undefined)
    const [error, setError] = useState<Error | undefined>(undefined)
    const [isCreating, setIsCreating] = useState<boolean>(false)

    const createGroup = useCallback(
        async (payload: GroupBulkCreatePayload): Promise<GroupBulkCreateResponse | undefined> => {
            setCreatedGroup(undefined)
            setError(undefined)
            setIsCreating(true)

            try {
                const group = await bulkCreateGroupService(payload)
                const failedMemberCount = (group.memberResults || [])
                    .filter(memberResult => !memberResult.success)
                    .length

                setCreatedGroup(group)
                if (failedMemberCount > 0) {
                    showErrorToast(`Group created, but ${failedMemberCount} member additions failed`)
                } else {
                    showSuccessToast('Group created successfully')
                }

                return group
            } catch (error_) {
                const normalizedError = normalizeError(error_, 'Failed to create group')

                setError(normalizedError)
                showErrorToast(normalizedError.message)

                return undefined
            } finally {
                setIsCreating(false)
            }
        },
        [],
    )

    return {
        createdGroup,
        createGroup,
        error,
        isCreating,
    }
}

export default useBulkCreateGroup
