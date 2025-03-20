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
import { fetchRole, searchUsers, unassignRole } from '../services'
import { handleError } from '../utils'

/// /////////////////
// Permission role members reducer
/// ////////////////

type RolesState = {
    isLoading: boolean
    isFiltering: boolean
    isRemoving: { [key: string]: boolean }
    roleInfo?: UserRole
    filteredRoleMembers: RoleMemberInfo[]
    allRoleMembers: RoleMemberInfo[]
}

const RolesActionType = {
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
          type: typeof RolesActionType.FETCH_ROLE_MEMBERS_DONE
          payload: UserRole
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
                allRoleMembers: [],
                filteredRoleMembers: [],
                isLoading: true,
            }
        }

        case RolesActionType.FETCH_ROLE_MEMBERS_DONE: {
            const roleInfo = action.payload
            const allRoleMembers = (roleInfo.subjects || []).map(
                memberId => ({ id: memberId }),
            )
            return {
                ...previousState,
                allRoleMembers,
                filteredRoleMembers: allRoleMembers,
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

        case RolesActionType.FILTER_ROLE_MEMBERS_INIT: {
            return {
                ...previousState,
                filteredRoleMembers: [],
                isFiltering: true,
            }
        }

        case RolesActionType.FILTER_ROLE_MEMBERS_DONE: {
            return {
                ...previousState,
                filteredRoleMembers: action.payload,
                isFiltering: false,
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
            const allRoleMembers = _.filter(
                previousState.allRoleMembers,
                role => role.id !== action.payload,
            )
            const filteredRoleMembers = _.filter(
                previousState.allRoleMembers,
                role => role.id !== action.payload,
            )
            return {
                ...previousState,
                allRoleMembers,
                filteredRoleMembers,
                isRemoving: {
                    ...previousState.isRemoving,
                    [action.payload]: false,
                },
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
        allRoleMembers: [],
        filteredRoleMembers: [],
        isFiltering: false,
        isLoading: false,
        isRemoving: {},
    })
    const isLoadingRef = useRef(false)
    const isRemovingBool = useMemo(
        () => _.some(state.isRemoving, value => value === true),
        [state.isRemoving],
    )

    const doFetchRole = useCallback(() => {
        dispatch({
            type: RolesActionType.FETCH_ROLE_MEMBERS_INIT,
        })
        isLoadingRef.current = true
        fetchRole(roleId, ['id', 'roleName', 'subjects'])
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

    const doFilterRoleMembers = useCallback(
        (filterData: FormRoleMembersFilters) => {
            let filteredMembers = _.clone(state.allRoleMembers)

            // filter by ids first, it works immediately as we know all the data
            // so we don't need to show loader for this
            if (filterData.userId) {
                filteredMembers = _.filter(filteredMembers, {
                    id: filterData.userId,
                })
            }

            // if handle filter is defined and we still have some rows to filter
            if (filterData.userHandle && filteredMembers.length > 0) {
                // we show loader as we need to make request to the server
                dispatch({
                    type: RolesActionType.FILTER_ROLE_MEMBERS_INIT,
                })

                // As there is no server API to filter role members and we don't have
                // user handles to filter, we first have to find user ids by it's handle
                // and after we can filter users by id
                searchUsers({
                    fields: 'id',
                    filter: `handle=*${filterData.userHandle}*&like=true`,
                    limit: 1000000, // set big limit to make sure server returns all records
                })
                    .then(result => {
                        const foundIds = _.map(result, 'id')

                        filteredMembers = _.filter(
                            filteredMembers,
                            (member: RoleMemberInfo) => _.includes(foundIds, member.id),
                        )
                        dispatch({
                            payload: filteredMembers,
                            type: RolesActionType.FILTER_ROLE_MEMBERS_DONE,
                        })
                    })
                    .catch(e => {
                        dispatch({
                            type: RolesActionType.FILTER_ROLE_MEMBERS_FAILED,
                        })
                        handleError(e)
                    })

                // if we don't filter by handle which makes server request
                // redraw table immediately
            } else {
                dispatch({
                    payload: filteredMembers,
                    type: RolesActionType.FILTER_ROLE_MEMBERS_DONE,
                })
            }
        },
        [dispatch, state.allRoleMembers],
    )

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
                })
                .catch(e => {
                    dispatch({
                        payload: roleMember.id,
                        type: RolesActionType.REMOVE_ROLE_MEMBERS_FAILED,
                    })
                    handleError(e)
                })
        },
        [dispatch, roleId],
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
        [dispatch, roleId],
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
        roleInfo: state.roleInfo,
        roleMembers: state.filteredRoleMembers,
    }
}
