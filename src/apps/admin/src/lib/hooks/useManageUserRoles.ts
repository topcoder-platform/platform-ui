/**
 * Manage user roles redux state
 */
import { useCallback, useReducer } from 'react'
import { toast } from 'react-toastify'
import _ from 'lodash'

import { UserInfo, UserRole } from '../models'
import {
    assignRole,
    fetchRoles,
    fetchRolesBySubject,
    unassignRole,
} from '../services'
import { handleError } from '../utils'

import { useOnComponentDidMount } from './useOnComponentDidMount'

/// /////////////////
// User roles reducer
/// ////////////////

type UserRolesState = {
    isLoading: boolean
    isAdding: boolean
    userRoles: UserRole[]
    allRoles: UserRole[]
    availableRoles: UserRole[]
    isRemoving: { [key: string]: boolean }
}

const UserRolesActionType = {
    ADD_USER_ROLE_DONE: 'ADD_USER_ROLE_DONE' as const,
    ADD_USER_ROLE_FAILED: 'ADD_USER_ROLE_FAILED' as const,
    ADD_USER_ROLE_INIT: 'ADD_USER_ROLE_INIT' as const,
    FETCH_USER_ROLES_DONE: 'FETCH_USER_ROLES_DONE' as const,
    FETCH_USER_ROLES_FAILED: 'FETCH_USER_ROLES_FAILED' as const,
    FETCH_USER_ROLES_INIT: 'FETCH_USER_ROLES_INIT' as const,
    REMOVE_USER_ROLE_DONE: 'REMOVE_USER_ROLE_DONE' as const,
    REMOVE_USER_ROLE_FAILED: 'REMOVE_USER_ROLE_FAILED' as const,
    REMOVE_USER_ROLE_INIT: 'REMOVE_USER_ROLE_INIT' as const,
}

type UserRolesReducerAction =
    | {
          type:
              | typeof UserRolesActionType.ADD_USER_ROLE_INIT
              | typeof UserRolesActionType.ADD_USER_ROLE_FAILED
              | typeof UserRolesActionType.FETCH_USER_ROLES_INIT
              | typeof UserRolesActionType.FETCH_USER_ROLES_FAILED
      }
    | {
          type: typeof UserRolesActionType.FETCH_USER_ROLES_DONE
          payload: UserRole[][]
      }
    | {
          type: typeof UserRolesActionType.ADD_USER_ROLE_DONE
          payload: string
      }
    | {
          type:
              | typeof UserRolesActionType.REMOVE_USER_ROLE_DONE
              | typeof UserRolesActionType.REMOVE_USER_ROLE_INIT
              | typeof UserRolesActionType.REMOVE_USER_ROLE_FAILED
          payload: string
      }

function getAvailableRoles(
    userRoles: UserRole[],
    allRoles: UserRole[],
): UserRole[] {
    const userRoleIds = userRoles.map((role: UserRole) => role.id)
    return allRoles.filter((role: UserRole) => userRoleIds.indexOf(role.id) === -1)
}

const reducer = (
    previousState: UserRolesState,
    action: UserRolesReducerAction,
): UserRolesState => {
    switch (action.type) {
        case UserRolesActionType.FETCH_USER_ROLES_INIT: {
            return {
                ...previousState,
                allRoles: [],
                availableRoles: [],
                isLoading: true,
                userRoles: [],
            }
        }

        case UserRolesActionType.FETCH_USER_ROLES_DONE: {
            const userRoles = action.payload[0]
            const allRoles = action.payload[1]
            return {
                ...previousState,
                allRoles,
                availableRoles: getAvailableRoles(userRoles, allRoles),
                isLoading: false,
                userRoles,
            }
        }

        case UserRolesActionType.FETCH_USER_ROLES_FAILED: {
            return {
                ...previousState,
                isLoading: false,
            }
        }

        case UserRolesActionType.ADD_USER_ROLE_INIT: {
            return {
                ...previousState,
                isAdding: true,
            }
        }

        case UserRolesActionType.ADD_USER_ROLE_DONE: {
            const newRole = _.find(previousState.availableRoles, {
                id: action.payload,
            })
            const userRoles = _.orderBy(
                [...previousState.userRoles, ...(newRole ? [newRole] : [])],
                ['roleName'],
                ['asc'],
            )
            return {
                ...previousState,
                availableRoles: getAvailableRoles(
                    userRoles,
                    previousState.allRoles,
                ),
                isAdding: false,
                userRoles,
            }
        }

        case UserRolesActionType.ADD_USER_ROLE_FAILED: {
            return {
                ...previousState,
                isAdding: false,
            }
        }

        case UserRolesActionType.REMOVE_USER_ROLE_INIT: {
            return {
                ...previousState,
                isRemoving: {
                    ...previousState.isRemoving,
                    [action.payload]: true,
                },
            }
        }

        case UserRolesActionType.REMOVE_USER_ROLE_DONE: {
            const userRoles = _.filter(
                previousState.userRoles,
                role => role.id !== action.payload,
            )
            return {
                ...previousState,
                availableRoles: getAvailableRoles(
                    userRoles,
                    previousState.allRoles,
                ),
                isRemoving: {
                    ...previousState.isRemoving,
                    [action.payload]: false,
                },
                userRoles,
            }
        }

        case UserRolesActionType.REMOVE_USER_ROLE_FAILED: {
            return {
                ...previousState,
                isRemoving: {
                    ...previousState.isRemoving,
                    [action.payload]: false,
                },
            }
        }

        default: {
            return previousState
        }
    }
}

export interface useManageUserRolesProps {
    isLoading: boolean
    isRemoving: { [key: string]: boolean }
    isAdding: boolean
    userRoles: UserRole[]
    availableRoles: UserRole[]
    doAddRole: (newRoleId: string, success?: () => void) => void
    doRemoveRole: (roleId: string) => void
}

/**
 * Manage userRoles redux state
 * @param userInfo user info
 * @returns state data
 */
export function useManageUserRoles(
    userInfo: UserInfo,
): useManageUserRolesProps {
    const [state, dispatch] = useReducer(reducer, {
        allRoles: [],
        availableRoles: [],
        isAdding: false,
        isLoading: false,
        isRemoving: {},
        userRoles: [],
    })

    const doFetchUserRoles = useCallback(() => {
        dispatch({
            type: UserRolesActionType.FETCH_USER_ROLES_INIT,
        })
        Promise.all([fetchRolesBySubject(userInfo.id), fetchRoles()])
            .then(result => {
                dispatch({
                    payload: result,
                    type: UserRolesActionType.FETCH_USER_ROLES_DONE,
                })
            })
            .catch(e => {
                dispatch({
                    type: UserRolesActionType.FETCH_USER_ROLES_FAILED,
                })
                handleError(e)
            })
    }, [dispatch, userInfo])

    const doAddRole = useCallback(
        (newRoleId: string, success?: () => void) => {
            dispatch({
                type: UserRolesActionType.ADD_USER_ROLE_INIT,
            })
            assignRole(newRoleId, userInfo.id)
                .then(() => {
                    toast.success('Role added successfully', {
                        toastId: 'Add role',
                    })
                    dispatch({
                        payload: newRoleId,
                        type: UserRolesActionType.ADD_USER_ROLE_DONE,
                    })
                    success?.()
                })
                .catch(e => {
                    dispatch({
                        type: UserRolesActionType.ADD_USER_ROLE_FAILED,
                    })
                    handleError(e)
                })
        },
        [dispatch, userInfo],
    )

    const doRemoveRole = useCallback(
        (roleId: string) => {
            dispatch({
                payload: roleId,
                type: UserRolesActionType.REMOVE_USER_ROLE_INIT,
            })
            unassignRole(roleId, userInfo.id)
                .then(() => {
                    toast.success('Role removed successfully', {
                        toastId: 'Remove role',
                    })
                    dispatch({
                        payload: roleId,
                        type: UserRolesActionType.REMOVE_USER_ROLE_DONE,
                    })
                })
                .catch(e => {
                    dispatch({
                        payload: roleId,
                        type: UserRolesActionType.REMOVE_USER_ROLE_FAILED,
                    })
                    handleError(e)
                })
        },
        [dispatch, userInfo],
    )

    useOnComponentDidMount(() => {
        doFetchUserRoles()
    })

    return {
        availableRoles: state.availableRoles,
        doAddRole,
        doRemoveRole,
        isAdding: state.isAdding,
        isLoading: state.isLoading,
        isRemoving: state.isRemoving,
        userRoles: state.userRoles,
    }
}
