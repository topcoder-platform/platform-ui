/**
 * Manage permission add group members redux state
 */
import { useCallback, useReducer } from 'react'
import { toast } from 'react-toastify'

import { addGroupMember } from '../services'
import { handleError } from '../utils'

/// /////////////////
// Permission add group members reducer
/// ////////////////

type RolesState = {
    isAdding: boolean
}

const RolesActionType = {
    ADD_ROLE_MEMBERS_DONE: 'ADD_ROLE_MEMBERS_DONE' as const,
    ADD_ROLE_MEMBERS_FAILED: 'ADD_ROLE_MEMBERS_FAILED' as const,
    ADD_ROLE_MEMBERS_INIT: 'ADD_ROLE_MEMBERS_INIT' as const,
}

type RolesReducerAction = {
    type:
        | typeof RolesActionType.ADD_ROLE_MEMBERS_DONE
        | typeof RolesActionType.ADD_ROLE_MEMBERS_INIT
        | typeof RolesActionType.ADD_ROLE_MEMBERS_FAILED
}

const reducer = (
    previousState: RolesState,
    action: RolesReducerAction,
): RolesState => {
    switch (action.type) {
        case RolesActionType.ADD_ROLE_MEMBERS_INIT: {
            return {
                ...previousState,
                isAdding: true,
            }
        }

        case RolesActionType.ADD_ROLE_MEMBERS_DONE: {
            return {
                ...previousState,
                isAdding: false,
            }
        }

        case RolesActionType.ADD_ROLE_MEMBERS_FAILED: {
            return {
                ...previousState,
                isAdding: false,
            }
        }

        default: {
            return previousState
        }
    }
}

export interface useManageAddGroupMembersProps {
    isAdding: boolean
    doAddGroup: (
        membershipType: string,
        memberIds: string[],
        callBack: () => void,
    ) => void
}

/**
 * Manage permission add group members redux state
 * @param groupId group id
 * @returns state data
 */
export function useManageAddGroupMembers(
    groupId: string,
): useManageAddGroupMembersProps {
    const [state, dispatch] = useReducer(reducer, {
        isAdding: false,
    })

    const doAddGroup = useCallback(
        (membershipType: string, memberIds: string[], callBack: () => void) => {
            dispatch({
                type: RolesActionType.ADD_ROLE_MEMBERS_INIT,
            })
            let hasSubmissionErrors = false
            Promise.all(
                memberIds.map(async item => addGroupMember(
                    groupId,
                    {
                        memberId: item,
                        membershipType: membershipType as 'user' | 'group',
                    },
                )
                    .catch(e => {
                        hasSubmissionErrors = true
                        handleError(e)
                    })),
            )
                .then(() => {
                    if (!hasSubmissionErrors) {
                        // Change the success message based on the membership type
                        const entityType = membershipType === 'user' ? 'Member' : 'Group'
                        toast.success(
                            `${
                                memberIds.length > 1 ? `${entityType}s` : entityType
                            } added successfully`,
                            {
                                toastId: `Add ${entityType.toLowerCase()}s`,
                            },
                        )
                        callBack()
                    }

                    dispatch({
                        type: RolesActionType.ADD_ROLE_MEMBERS_DONE,
                    })
                })
                .catch(e => {
                    dispatch({
                        type: RolesActionType.ADD_ROLE_MEMBERS_FAILED,
                    })
                    handleError(e)
                })
        },
        [dispatch, groupId],
    )

    return {
        doAddGroup,
        isAdding: state.isAdding,
    }
}
