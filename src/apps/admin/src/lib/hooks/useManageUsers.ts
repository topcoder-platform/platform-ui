/**
 * Manage users redux state
 */
import { useCallback, useReducer } from 'react'
import { toast } from 'react-toastify'
import _ from 'lodash'

import { UserInfo } from '../models'
import { searchUsers, updateUserStatus } from '../services'
import { handleError } from '../utils'

/// /////////////////
// Users reducer
/// ////////////////

type UsersState = {
    isLoading: boolean
    users: UserInfo[]
    updatingStatus: { [key: string]: boolean }
}

const UsersActionType = {
    FETCH_USERS_DONE: 'FETCH_USERS_DONE' as const,
    FETCH_USERS_FAILED: 'FETCH_USERS_FAILED' as const,
    FETCH_USERS_INIT: 'FETCH_USERS_INIT' as const,
    UPDATE_USER_STATUS_DONE: 'UPDATE_USER_STATUS_DONE' as const,
    UPDATE_USER_STATUS_FAILED: 'UPDATE_USER_STATUS_FAILED' as const,
    UPDATE_USER_STATUS_INIT: 'UPDATE_USER_STATUS_INIT' as const,
}

type UsersReducerAction =
    | {
          type:
              | typeof UsersActionType.FETCH_USERS_INIT
              | typeof UsersActionType.FETCH_USERS_FAILED
      }
    | {
          type: typeof UsersActionType.FETCH_USERS_DONE
          payload: UserInfo[]
      }
    | {
          type:
              | typeof UsersActionType.UPDATE_USER_STATUS_INIT
              | typeof UsersActionType.UPDATE_USER_STATUS_FAILED
          payload: string
      }
    | {
          type: typeof UsersActionType.UPDATE_USER_STATUS_DONE
          payload: UserInfo
      }

const reducer = (
    previousState: UsersState,
    action: UsersReducerAction,
): UsersState => {
    switch (action.type) {
        case UsersActionType.FETCH_USERS_INIT: {
            return {
                ...previousState,
                isLoading: true,
                users: [],
            }
        }

        case UsersActionType.FETCH_USERS_DONE: {
            return {
                ...previousState,
                isLoading: false,
                users: action.payload,
            }
        }

        case UsersActionType.FETCH_USERS_FAILED: {
            return {
                ...previousState,
                isLoading: false,
            }
        }

        case UsersActionType.UPDATE_USER_STATUS_INIT: {
            return {
                ...previousState,
                updatingStatus: {
                    ...previousState.updatingStatus,
                    [action.payload]: true,
                },
            }
        }

        case UsersActionType.UPDATE_USER_STATUS_DONE: {
            const userInfo = action.payload
            return {
                ...previousState,
                updatingStatus: {
                    ...previousState.updatingStatus,
                    [userInfo.id]: false,
                },
                users: _.map(previousState.users, item => (userInfo.id !== item.id ? item : userInfo)),
            }
        }

        case UsersActionType.UPDATE_USER_STATUS_FAILED: {
            return {
                ...previousState,
                updatingStatus: {
                    ...previousState.updatingStatus,
                    [action.payload]: false,
                },
            }
        }

        default: {
            return previousState
        }
    }
}

export interface useManageUsersProps {
    isLoading: boolean
    users: UserInfo[]
    doSearchUsers: (filter: string) => void
    updatingStatus: { [key: string]: boolean }
    doUpdateStatus: (
        userInfo: UserInfo,
        newStatus: string,
        comment: string,
        onSuccess?: () => void,
    ) => void
}

/**
 * Manage users redux state
 * @returns state data
 */
export function useManageUsers(): useManageUsersProps {
    const [state, dispatch] = useReducer(reducer, {
        isLoading: false,
        updatingStatus: {},
        users: [],
    })

    const doSearchUsers = useCallback(
        (filter: string) => {
            dispatch({
                type: UsersActionType.FETCH_USERS_INIT,
            })
            searchUsers({ filter })
                .then(result => {
                    dispatch({
                        payload: result,
                        type: UsersActionType.FETCH_USERS_DONE,
                    })
                })
                .catch(e => {
                    dispatch({
                        type: UsersActionType.FETCH_USERS_FAILED,
                    })
                    handleError(e)
                })
        },
        [dispatch],
    )

    const doUpdateStatus = useCallback(
        (
            userInfo: UserInfo,
            newStatus: string,
            comment: string,
            onSuccess?: () => void,
        ) => {
            if (newStatus === userInfo.status) {
                toast.error('Status is not changed.', {
                    toastId: 'Update status',
                })
                return
            }

            dispatch({
                payload: userInfo.id,
                type: UsersActionType.UPDATE_USER_STATUS_INIT,
            })
            updateUserStatus(userInfo.id, newStatus, comment)
                .then(result => {
                    dispatch({
                        payload: result,
                        type: UsersActionType.UPDATE_USER_STATUS_DONE,
                    })
                    toast.success('Status updated successfully', {
                        toastId: 'Update status',
                    })
                    onSuccess?.()
                })
                .catch(e => {
                    dispatch({
                        payload: userInfo.id,
                        type: UsersActionType.UPDATE_USER_STATUS_FAILED,
                    })
                    handleError(e)
                })
        },
        [dispatch],
    )

    return {
        doSearchUsers,
        doUpdateStatus,
        isLoading: state.isLoading,
        updatingStatus: state.updatingStatus,
        users: state.users,
    }
}
