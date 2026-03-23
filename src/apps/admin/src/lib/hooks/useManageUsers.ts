/**
 * Manage users redux state
 */
import { useCallback, useReducer, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import _ from 'lodash'

import { Sort } from '~/apps/admin/src/platform/gamification-admin/src/game-lib'

import { UserInfo } from '../models'
import { deleteUser, searchUsersPaginated, updateUserStatus } from '../services'
import { TABLE_PAGINATION_ITEM_PER_PAGE } from '../../config/index.config'
import { handleError } from '../utils'

/// /////////////////
// Users reducer
/// ////////////////

type UsersState = {
    deletingUsers: { [key: string]: boolean }
    isLoading: boolean
    page: number
    total: number
    totalPages: number
    updatingStatus: { [key: string]: boolean }
    users: UserInfo[]
}

const UsersActionType = {
    DELETE_USER_DONE: 'DELETE_USER_DONE' as const,
    DELETE_USER_FAILED: 'DELETE_USER_FAILED' as const,
    DELETE_USER_INIT: 'DELETE_USER_INIT' as const,
    FETCH_USERS_DONE: 'FETCH_USERS_DONE' as const,
    FETCH_USERS_FAILED: 'FETCH_USERS_FAILED' as const,
    FETCH_USERS_INIT: 'FETCH_USERS_INIT' as const,
    SET_PAGE: 'SET_PAGE' as const,
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
          payload: { page: number; total: number; totalPages: number; users: UserInfo[] }
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
                deletingUsers: {
                    ...previousState.deletingUsers,
                    [userInfo.id]: false,
                },
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
                total: Math.max(previousState.total - 1, 0),
                users: previousState.users.filter(user => user.id !== userId),
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
    sort: Sort | undefined
    onPageChange: (page: number) => void
    onSortChange: (sort: Sort | undefined) => void
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
        deletingUsers: {},
        isLoading: false,
        page: 1,
        total: 0,
        totalPages: 0,
        updatingStatus: {},
        users: [],
    })
    const [sort, setSort] = useState<Sort | undefined>()
    const filterRef = useRef('')
    const hasSearchedRef = useRef(false)
    const sortRef = useRef<Sort | undefined>()

    /**
     * Fetches one page of users with the current filter and optional server-side sort.
     * @param filter Active legacy filter string.
     * @param page Page number to request.
     * @param sortToApply Current table sort, if any.
     * @returns Resolves when the request completes and state is updated.
     */
    const fetchUsers = useCallback(
        (filter: string, page: number, sortToApply?: Sort) => {
            dispatch({
                type: UsersActionType.FETCH_USERS_INIT,
            })

            const offset = (page - 1) * TABLE_PAGINATION_ITEM_PER_PAGE

            return searchUsersPaginated({
                filter,
                limit: TABLE_PAGINATION_ITEM_PER_PAGE,
                offset,
                sortBy: sortToApply?.fieldName,
                sortOrder: sortToApply?.direction,
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

    const doSearchUsers = useCallback(
        (filter: string) => {
            hasSearchedRef.current = true
            filterRef.current = filter || ''
            fetchUsers(filterRef.current, 1, sortRef.current)
        },
        [fetchUsers],
    )

    const onPageChange = useCallback(
        (page: number) => {
            if (page < 1 || !hasSearchedRef.current) return
            fetchUsers(filterRef.current, page, sortRef.current)
        },
        [fetchUsers],
    )

    const onSortChange = useCallback(
        (nextSort: Sort | undefined) => {
            sortRef.current = nextSort
            setSort(nextSort)

            if (!hasSearchedRef.current) {
                return
            }

            fetchUsers(filterRef.current, 1, nextSort)
        },
        [fetchUsers],
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
        deletingUsers: state.deletingUsers,
        doDeleteUser,
        doSearchUsers,
        doUpdateStatus,
        isLoading: state.isLoading,
        onPageChange,
        onSortChange,
        page: state.page,
        sort,
        totalPages: state.totalPages,
        updatingStatus: state.updatingStatus,
        users: state.users,
    }
}
