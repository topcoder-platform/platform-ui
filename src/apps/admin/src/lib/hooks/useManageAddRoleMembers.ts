/**
 * Manage permission add role members redux state
 */
import { useCallback, useEffect, useReducer, useRef } from 'react'
import { toast } from 'react-toastify'

import { SearchUserInfo, UserRole } from '../models'
import { assignRole, fetchRole } from '../services'
import { handleError } from '../utils'

/// /////////////////
// Permission role Members reducer
/// ////////////////

type RolesState = {
    isLoading: boolean
    isAdding: boolean
    roleInfo?: UserRole
}

const RolesActionType = {
    ADD_ROLE_MEMBERS_DONE: 'ADD_ROLE_MEMBERS_DONE' as const,
    ADD_ROLE_MEMBERS_FAILED: 'ADD_ROLE_MEMBERS_FAILED' as const,
    ADD_ROLE_MEMBERS_INIT: 'ADD_ROLE_MEMBERS_INIT' as const,
    FETCH_ROLE_MEMBERS_DONE: 'FETCH_ROLE_MEMBERS_DONE' as const,
    FETCH_ROLE_MEMBERS_FAILED: 'FETCH_ROLE_MEMBERS_FAILED' as const,
    FETCH_ROLE_MEMBERS_INIT: 'FETCH_ROLE_MEMBERS_INIT' as const,
}

type RolesReducerAction =
    | {
          type:
              | typeof RolesActionType.ADD_ROLE_MEMBERS_DONE
              | typeof RolesActionType.ADD_ROLE_MEMBERS_INIT
              | typeof RolesActionType.ADD_ROLE_MEMBERS_FAILED
              | typeof RolesActionType.FETCH_ROLE_MEMBERS_INIT
              | typeof RolesActionType.FETCH_ROLE_MEMBERS_FAILED
      }
    | {
          type: typeof RolesActionType.FETCH_ROLE_MEMBERS_DONE
          payload: UserRole
      }

const reducer = (
    previousState: RolesState,
    action: RolesReducerAction,
): RolesState => {
    switch (action.type) {
        case RolesActionType.FETCH_ROLE_MEMBERS_INIT: {
            return {
                ...previousState,
                isLoading: true,
            }
        }

        case RolesActionType.FETCH_ROLE_MEMBERS_DONE: {
            const roleInfo = action.payload
            return {
                ...previousState,
                isLoading: false,
                roleInfo,
            }
        }

        case RolesActionType.FETCH_ROLE_MEMBERS_FAILED: {
            return {
                ...previousState,
                isLoading: false,
            }
        }

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

export interface useManageAddRoleMembersProps {
    isLoading: boolean
    isAdding: boolean
    roleInfo?: UserRole
    doAddRole: (userHandles: SearchUserInfo[], callBack: () => void) => void
}

/**
 * Manage permission add role members redux state
 * @param roleId role id
 * @returns state data
 */
export function useManageAddRoleMembers(
    roleId: string,
): useManageAddRoleMembersProps {
    const [state, dispatch] = useReducer(reducer, {
        isAdding: false,
        isLoading: false,
    })
    const isLoadingRef = useRef(false)

    const doFetchRole = useCallback(() => {
        dispatch({
            type: RolesActionType.FETCH_ROLE_MEMBERS_INIT,
        })
        isLoadingRef.current = true
        fetchRole(roleId, ['id', 'roleName'])
            .then(result => {
                isLoadingRef.current = false
                dispatch({
                    payload: result,
                    type: RolesActionType.FETCH_ROLE_MEMBERS_DONE,
                })
            })
            .catch(e => {
                isLoadingRef.current = false
                dispatch({
                    type: RolesActionType.FETCH_ROLE_MEMBERS_FAILED,
                })
                handleError(e)
            })
    }, [dispatch, roleId])

    const doAddRole = useCallback(
        (userHandles: SearchUserInfo[], callBack: () => void) => {
            dispatch({
                type: RolesActionType.ADD_ROLE_MEMBERS_INIT,
            })
            let hasSubmissionErrors = false
            Promise.all(
                userHandles.map(async item => assignRole(roleId, `${item.userId}`)
                    .catch(e => {
                        hasSubmissionErrors = true
                        handleError(e)
                    })),
            )
                .then(() => {
                    if (!hasSubmissionErrors) {
                        toast.success(
                            `${
                                userHandles.length > 1 ? 'Roles' : 'Role'
                            } added successfully`,
                            {
                                toastId: 'Add roles',
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
        [dispatch, roleId],
    )

    useEffect(() => {
        if (!isLoadingRef.current) {
            doFetchRole()
        }
    }, [roleId, doFetchRole])

    return {
        doAddRole,
        isAdding: state.isAdding,
        isLoading: state.isLoading,
        roleInfo: state.roleInfo,
    }
}
