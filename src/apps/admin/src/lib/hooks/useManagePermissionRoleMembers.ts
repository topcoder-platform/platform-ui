/**
 * Manage permission role members redux state
 */
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { toast } from 'react-toastify'
import _ from 'lodash'

import {
    FormRoleMembersFilters,
    RoleMemberInfo,
    UserRole,
} from '../models'
import { fetchRole, fetchRoleMembersPaginated, unassignRole } from '../services'
import { handleError } from '../utils'
import { TABLE_PAGINATION_ITEM_PER_PAGE } from '../../config/index.config'

/// /////////////////
// Permission role members reducer
/// ////////////////

type RolesState = {
    isLoading: boolean
    isFiltering: boolean
    isRemoving: { [key: string]: boolean }
    roleInfo?: UserRole
    roleMembers: RoleMemberInfo[]
    page: number
    totalPages: number
}

const RolesActionType = {
    FETCH_ROLE_INFO_DONE: 'FETCH_ROLE_INFO_DONE' as const,
    FETCH_ROLE_MEMBERS_DONE: 'FETCH_ROLE_MEMBERS_DONE' as const,
    FETCH_ROLE_MEMBERS_FAILED: 'FETCH_ROLE_MEMBERS_FAILED' as const,
    FETCH_ROLE_MEMBERS_INIT: 'FETCH_ROLE_MEMBERS_INIT' as const,
    FILTER_ROLE_MEMBERS_DONE: 'FILTER_ROLE_MEMBERS_DONE' as const,
    FILTER_ROLE_MEMBERS_FAILED: 'FILTER_ROLE_MEMBERS_FAILED' as const,
    FILTER_ROLE_MEMBERS_INIT: 'FILTER_ROLE_MEMBERS_INIT' as const,
    REMOVE_ROLE_MEMBERS_DONE: 'REMOVE_ROLE_MEMBERS_DONE' as const,
    REMOVE_ROLE_MEMBERS_FAILED: 'REMOVE_ROLE_MEMBERS_FAILED' as const,
    REMOVE_ROLE_MEMBERS_INIT: 'REMOVE_ROLE_MEMBERS_INIT' as const,
}

type RolesReducerAction =
    | {
          type:
              | typeof RolesActionType.FETCH_ROLE_MEMBERS_INIT
              | typeof RolesActionType.FETCH_ROLE_MEMBERS_FAILED
              | typeof RolesActionType.FILTER_ROLE_MEMBERS_INIT
              | typeof RolesActionType.FILTER_ROLE_MEMBERS_FAILED
      }
    | {
          type: typeof RolesActionType.FETCH_ROLE_INFO_DONE
          payload: UserRole
      }
    | {
          type: typeof RolesActionType.FETCH_ROLE_MEMBERS_DONE
          payload: { data: RoleMemberInfo[]; page: number; totalPages: number }
      }
    | {
          type: typeof RolesActionType.FILTER_ROLE_MEMBERS_DONE
          payload: RoleMemberInfo[]
      }
    | {
          type:
              | typeof RolesActionType.REMOVE_ROLE_MEMBERS_DONE
              | typeof RolesActionType.REMOVE_ROLE_MEMBERS_INIT
              | typeof RolesActionType.REMOVE_ROLE_MEMBERS_FAILED
          payload: string
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
                roleMembers: [],
            }
        }

        case RolesActionType.FETCH_ROLE_INFO_DONE: {
            return {
                ...previousState,
                roleInfo: action.payload,
            }
        }

        case RolesActionType.FETCH_ROLE_MEMBERS_DONE: {
            return {
                ...previousState,
                isLoading: false,
                page: action.payload.page,
                roleMembers: action.payload.data,
                totalPages: action.payload.totalPages,
            }
        }

        case RolesActionType.FETCH_ROLE_MEMBERS_FAILED: {
            return {
                ...previousState,
                isLoading: false,
            }
        }

        case RolesActionType.FILTER_ROLE_MEMBERS_INIT: {
            return {
                ...previousState,
                isFiltering: true,
                roleMembers: [],
            }
        }

        case RolesActionType.FILTER_ROLE_MEMBERS_DONE: {
            return {
                ...previousState,
                isFiltering: false,
                roleMembers: action.payload,
            }
        }

        case RolesActionType.FILTER_ROLE_MEMBERS_FAILED: {
            return {
                ...previousState,
                isFiltering: false,
            }
        }

        case RolesActionType.REMOVE_ROLE_MEMBERS_INIT: {
            return {
                ...previousState,
                isRemoving: {
                    ...previousState.isRemoving,
                    [action.payload]: true,
                },
            }
        }

        case RolesActionType.REMOVE_ROLE_MEMBERS_DONE: {
            const roleMembers = _.filter(
                previousState.roleMembers,
                role => role.id !== action.payload,
            )
            return {
                ...previousState,
                isRemoving: {
                    ...previousState.isRemoving,
                    [action.payload]: false,
                },
                roleMembers,
            }
        }

        case RolesActionType.REMOVE_ROLE_MEMBERS_FAILED: {
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

export interface useManagePermissionRoleMembersProps {
    isLoading: boolean
    isFiltering: boolean
    isRemovingBool: boolean
    isRemoving: { [key: string]: boolean }
    roleInfo?: UserRole
    roleMembers: RoleMemberInfo[]
    page: number
    totalPages: number
    onPageChange: (page: number) => void
    doFilterRoleMembers: (filterData: FormRoleMembersFilters) => void
    doRemoveRoleMember: (roleMember: RoleMemberInfo) => void
    doRemoveRoleMembers: (roleMemberIds: string[], callBack: () => void) => void
}

/**
 * Manage permission role members redux state
 * @param roleId role id
 * @returns state data
 */
export function useManagePermissionRoleMembers(
    roleId: string,
): useManagePermissionRoleMembersProps {
    const [state, dispatch] = useReducer(reducer, {
        isFiltering: false,
        isLoading: false,
        isRemoving: {},
        page: 1,
        roleMembers: [],
        totalPages: 1,
    })
    const isLoadingRef = useRef(false)
    const filtersRef = useRef<FormRoleMembersFilters>({})
    const isRemovingBool = useMemo(
        () => _.some(state.isRemoving, value => value === true),
        [state.isRemoving],
    )

    const doFetchRole = useCallback(() => {
        dispatch({
            type: RolesActionType.FETCH_ROLE_MEMBERS_INIT,
        })
        isLoadingRef.current = true
        // Fetch role info (for title) then fetch first page of members
        fetchRole(roleId, ['id', 'roleName'])
            .then(async result => {
                dispatch({
                    payload: result,
                    type: RolesActionType.FETCH_ROLE_INFO_DONE,
                })
                const resp = await fetchRoleMembersPaginated(roleId, {
                    email: filtersRef.current.email,
                    page: 1,
                    perPage: TABLE_PAGINATION_ITEM_PER_PAGE,
                    userHandle: filtersRef.current.userHandle,
                    userId: filtersRef.current.userId,
                })
                isLoadingRef.current = false
                dispatch({
                    payload: {
                        data: resp.data,
                        page: resp.page || 1,
                        totalPages: resp.totalPages || 1,
                    },
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

    const doFilterRoleMembers = useCallback(
        (filterData: FormRoleMembersFilters) => {
            dispatch({ type: RolesActionType.FILTER_ROLE_MEMBERS_INIT })
            filtersRef.current = {
                email: filterData.email,
                userHandle: filterData.userHandle,
                userId: filterData.userId,
            }
            fetchRoleMembersPaginated(roleId, {
                page: 1,
                perPage: TABLE_PAGINATION_ITEM_PER_PAGE,
                ...filtersRef.current,
            })
                .then(resp => {
                    const mapped: RoleMemberInfo[] = resp.data.map(m => ({
                        email: m.email,
                        handle: m.handle,
                        id: m.id,
                    }))
                    dispatch({
                        payload: mapped,
                        type: RolesActionType.FILTER_ROLE_MEMBERS_DONE,
                    })
                    dispatch({
                        payload: {
                            data: mapped,
                            page: resp.page || 1,
                            totalPages: resp.totalPages || 1,
                        },
                        type: RolesActionType.FETCH_ROLE_MEMBERS_DONE,
                    })
                })
                .catch(e => {
                    dispatch({ type: RolesActionType.FILTER_ROLE_MEMBERS_FAILED })
                    handleError(e)
                })
        },
        [dispatch, roleId],
    )

    const onPageChange = useCallback((page: number) => {
        if (page < 1) return
        dispatch({ type: RolesActionType.FETCH_ROLE_MEMBERS_INIT })
        fetchRoleMembersPaginated(roleId, {
            page,
            perPage: TABLE_PAGINATION_ITEM_PER_PAGE,
            ...filtersRef.current,
        })
            .then(resp => {
                dispatch({
                    payload: {
                        data: resp.data,
                        page: resp.page || page,
                        totalPages: resp.totalPages || 1,
                    },
                    type: RolesActionType.FETCH_ROLE_MEMBERS_DONE,
                })
            })
            .catch(e => {
                dispatch({ type: RolesActionType.FETCH_ROLE_MEMBERS_FAILED })
                handleError(e)
            })
    }, [dispatch, roleId])

    const doRemoveRoleMember = useCallback(
        (roleMember: RoleMemberInfo) => {
            dispatch({
                payload: roleMember.id,
                type: RolesActionType.REMOVE_ROLE_MEMBERS_INIT,
            })
            unassignRole(roleId, roleMember.id)
                .then(() => {
                    toast.success('Role removed successfully', {
                        toastId: 'Remove role',
                    })
                    dispatch({
                        payload: roleMember.id,
                        type: RolesActionType.REMOVE_ROLE_MEMBERS_DONE,
                    })
                    // Refresh current page after remove
                    onPageChange((state.page || 1))
                })
                .catch(e => {
                    dispatch({
                        payload: roleMember.id,
                        type: RolesActionType.REMOVE_ROLE_MEMBERS_FAILED,
                    })
                    handleError(e)
                })
        },
        [dispatch, roleId, onPageChange, state.page],
    )

    const doRemoveRoleMembers = useCallback(
        (roleMemberIds: string[], callBack: () => void) => {
            let hasSubmissionErrors = false
            _.forEach(roleMemberIds, roleMemberId => {
                dispatch({
                    payload: roleMemberId,
                    type: RolesActionType.REMOVE_ROLE_MEMBERS_INIT,
                })
            })
            Promise.all(
                roleMemberIds.map(async roleMemberId => unassignRole(roleId, roleMemberId)
                    .catch(e => {
                        hasSubmissionErrors = true
                        handleError(e)
                    })),
            )
                .then(() => {
                    if (!hasSubmissionErrors) {
                        toast.success(
                            `${
                                roleMemberIds.length > 1 ? 'Roles' : 'Role'
                            } removed successfully`,
                            {
                                toastId: 'Remove roles',
                            },
                        )
                        callBack()
                    }

                    _.forEach(roleMemberIds, roleMemberId => {
                        dispatch({
                            payload: roleMemberId,
                            type: RolesActionType.REMOVE_ROLE_MEMBERS_DONE,
                        })
                    })
                    // Refresh current page after bulk remove
                    onPageChange((state.page || 1))
                })
                .catch(e => {
                    _.forEach(roleMemberIds, roleMemberId => {
                        dispatch({
                            payload: roleMemberId,
                            type: RolesActionType.REMOVE_ROLE_MEMBERS_FAILED,
                        })
                    })
                    handleError(e)
                })
        },
        [dispatch, roleId, onPageChange, state.page],
    )

    useEffect(() => {
        if (!isLoadingRef.current) {
            doFetchRole()
        }
    }, [roleId, doFetchRole])

    return {
        doFilterRoleMembers,
        doRemoveRoleMember,
        doRemoveRoleMembers,
        isFiltering: state.isFiltering,
        isLoading: state.isLoading,
        isRemoving: state.isRemoving,
        isRemovingBool,
        onPageChange,
        page: state.page,
        roleInfo: state.roleInfo,
        roleMembers: state.roleMembers,
        totalPages: state.totalPages,
    }
}
