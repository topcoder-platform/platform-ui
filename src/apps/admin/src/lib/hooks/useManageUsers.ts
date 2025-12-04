/**
 * Manage users redux state
 */
import { useCallback, useReducer, useRef } from 'react'
import { toast } from 'react-toastify'
import _ from 'lodash'

import { UserInfo } from '../models'
import { deleteUser, searchUsersPaginated, updateUserStatus } from '../services'
import { TABLE_PAGINATION_ITEM_PER_PAGE } from '../../config/index.config'
import { handleError } from '../utils'

/// /////////////////
// Users reducer
/// ////////////////

type UsersState = {
    isLoading: boolean
    users: UserInfo[]
    page: number
    totalPages: number
    total: number
    updatingStatus: { [key: string]: boolean }
    deletingUsers: { [key: string]: boolean }
}

const UsersActionType = {
    FETCH_USERS_DONE: 'FETCH_USERS_DONE' as const,
    FETCH_USERS_FAILED: 'FETCH_USERS_FAILED' as const,
    FETCH_USERS_INIT: 'FETCH_USERS_INIT' as const,
    SET_PAGE: 'SET_PAGE' as const,
    UPDATE_USER_STATUS_DONE: 'UPDATE_USER_STATUS_DONE' as const,
    UPDATE_USER_STATUS_FAILED: 'UPDATE_USER_STATUS_FAILED' as const,
    UPDATE_USER_STATUS_INIT: 'UPDATE_USER_STATUS_INIT' as const,
    DELETE_USER_INIT: 'DELETE_USER_INIT' as const,
    DELETE_USER_DONE: 'DELETE_USER_DONE' as const,
    DELETE_USER_FAILED: 'DELETE_USER_FAILED' as const,
}

type UsersReducerAction =
    | {
          type:
              | typeof UsersActionType.FETCH_USERS_INIT
              | typeof UsersActionType.FETCH_USERS_FAILED
      }
    | {
          type: typeof UsersActionType.FETCH_USERS_DONE
          payload: { users: UserInfo[]; page: number; totalPages: number; total: number }
      }
    | { type: typeof UsersActionType.SET_PAGE; payload: number }
    | {
          type:
              | typeof UsersActionType.UPDATE_USER_STATUS_INIT
              | typeof UsersActionType.UPDATE_USER_STATUS_FAILED
              | typeof UsersActionType.DELETE_USER_INIT
              | typeof UsersActionType.DELETE_USER_FAILED
          payload: string
      }
    | {
          type: typeof UsersActionType.UPDATE_USER_STATUS_DONE
          payload: UserInfo
      }
    | {
          type: typeof UsersActionType.DELETE_USER_DONE
          payload: string
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
                page: action.payload.page,
                total: action.payload.total,
                totalPages: action.payload.totalPages,
                users: action.payload.users,
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
                deletingUsers: {
                    ...previousState.deletingUsers,
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

        case UsersActionType.DELETE_USER_INIT: {
            return {
                ...previousState,
                deletingUsers: {
                    ...previousState.deletingUsers,
                    [action.payload]: true,
                },
            }
        }

        case UsersActionType.DELETE_USER_DONE: {
            const userId = action.payload
            return {
                ...previousState,
                deletingUsers: {
                    ...previousState.deletingUsers,
                    [userId]: false,
                },
                users: previousState.users.filter(user => user.id !== userId),
                total: Math.max(previousState.total - 1, 0),
            }
        }

        case UsersActionType.DELETE_USER_FAILED: {
            return {
                ...previousState,
                deletingUsers: {
                    ...previousState.deletingUsers,
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
    page: number
    totalPages: number
    onPageChange: (page: number) => void
    updatingStatus: { [key: string]: boolean }
    deletingUsers: { [key: string]: boolean }
    doUpdateStatus: (
        userInfo: UserInfo,
        newStatus: string,
        comment: string,
        onSuccess?: () => void,
    ) => void
    doDeleteUser: (
        userInfo: UserInfo,
        ticketUrl: string,
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
        page: 1,
        total: 0,
        totalPages: 0,
        updatingStatus: {},
        deletingUsers: {},
        users: [],
    })
    const filterRef = useRef('')

    const doSearchUsers = useCallback(
        (filter: string) => {
            dispatch({
                type: UsersActionType.FETCH_USERS_INIT,
            })
            filterRef.current = filter || ''
            searchUsersPaginated({
                filter: filterRef.current,
                limit: TABLE_PAGINATION_ITEM_PER_PAGE,
                offset: 0,
            })
                .then(result => {
                    dispatch({
                        payload: {
                            page: result.page || 1,
                            total: result.total || 0,
                            totalPages: result.totalPages || 0,
                            users: result.data,
                        },
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

    const onPageChange = useCallback(
        (page: number) => {
            if (page < 1) return
            dispatch({
                type: UsersActionType.FETCH_USERS_INIT,
            })
            const offset = (page - 1) * TABLE_PAGINATION_ITEM_PER_PAGE
            searchUsersPaginated({
                filter: filterRef.current,
                limit: TABLE_PAGINATION_ITEM_PER_PAGE,
                offset,
            })
                .then(result => {
                    dispatch({
                        payload: {
                            page: result.page || page,
                            total: result.total || 0,
                            totalPages: result.totalPages || 0,
                            users: result.data,
                        },
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

    const doDeleteUser = useCallback(
        (userInfo: UserInfo, ticketUrl: string, onSuccess?: () => void) => {
            if (!ticketUrl) {
                toast.error('Delete ticket URL is required', {
                    toastId: 'Delete user',
                })
                return
            }

            dispatch({
                payload: userInfo.id,
                type: UsersActionType.DELETE_USER_INIT,
            })

            deleteUser(userInfo.handle, ticketUrl)
                .then(() => {
                    dispatch({
                        payload: userInfo.id,
                        type: UsersActionType.DELETE_USER_DONE,
                    })
                    toast.success('User deleted successfully', {
                        toastId: 'Delete user',
                    })
                    onSuccess?.()
                })
                .catch(e => {
                    dispatch({
                        payload: userInfo.id,
                        type: UsersActionType.DELETE_USER_FAILED,
                    })
                    handleError(e)
                })
        },
        [dispatch],
    )

    return {
        doSearchUsers,
        doDeleteUser,
        doUpdateStatus,
        isLoading: state.isLoading,
        onPageChange,
        page: state.page,
        totalPages: state.totalPages,
        deletingUsers: state.deletingUsers,
        updatingStatus: state.updatingStatus,
        users: state.users,
    }
}
