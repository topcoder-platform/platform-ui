/**
 * Manage user groups redux state
 */
import { useCallback, useReducer } from 'react'
import { toast } from 'react-toastify'
import _ from 'lodash'

import { UserGroup, UserGroupMember, UserInfo } from '../models'
import {
    addMember,
    fetchGroupMembers,
    fetchGroups,
    findByMember,
    removeMember,
} from '../services'
import { handleError } from '../utils'

import { useOnComponentDidMount } from './useOnComponentDidMount'

/// /////////////////
// User groups reducer
/// ////////////////

// used to get all groups
const PAGE = 1
const PER_PAGE = 1000

type UserGroupsState = {
    isLoading: boolean
    isAdding: boolean
    userGroups: UserGroup[]
    allGroups: UserGroup[]
    availableGroups: UserGroup[]
    isRemoving: { [key: string]: boolean }
}

const UserGroupsActionType = {
    ADD_USER_GROUP_DONE: 'ADD_USER_GROUP_DONE' as const,
    ADD_USER_GROUP_FAILED: 'ADD_USER_GROUP_FAILED' as const,
    ADD_USER_GROUP_INIT: 'ADD_USER_GROUP_INIT' as const,
    FETCH_USER_GROUPS_DONE: 'FETCH_USER_GROUPS_DONE' as const,
    FETCH_USER_GROUPS_FAILED: 'FETCH_USER_GROUPS_FAILED' as const,
    FETCH_USER_GROUPS_INIT: 'FETCH_USER_GROUPS_INIT' as const,
    REMOVE_USER_GROUP_DONE: 'REMOVE_USER_GROUP_DONE' as const,
    REMOVE_USER_GROUP_FAILED: 'REMOVE_USER_GROUP_FAILED' as const,
    REMOVE_USER_GROUP_INIT: 'REMOVE_USER_GROUP_INIT' as const,
}

type UserGroupsReducerAction =
    | {
          type:
              | typeof UserGroupsActionType.ADD_USER_GROUP_INIT
              | typeof UserGroupsActionType.ADD_USER_GROUP_FAILED
              | typeof UserGroupsActionType.FETCH_USER_GROUPS_INIT
              | typeof UserGroupsActionType.FETCH_USER_GROUPS_FAILED
      }
    | {
          type: typeof UserGroupsActionType.FETCH_USER_GROUPS_DONE
          payload: UserGroup[][]
      }
    | {
          type: typeof UserGroupsActionType.ADD_USER_GROUP_DONE
          payload: string
      }
    | {
          type:
              | typeof UserGroupsActionType.REMOVE_USER_GROUP_DONE
              | typeof UserGroupsActionType.REMOVE_USER_GROUP_INIT
              | typeof UserGroupsActionType.REMOVE_USER_GROUP_FAILED
          payload: string
      }

function getAvailableGroups(
    userGroups: UserGroup[],
    allGroups: UserGroup[],
): UserGroup[] {
    const userGroupIds = userGroups.map((group: UserGroup) => group.id)
    return allGroups.filter((group: UserGroup) => userGroupIds.indexOf(group.id) === -1)
}

const reducer = (
    previousState: UserGroupsState,
    action: UserGroupsReducerAction,
): UserGroupsState => {
    switch (action.type) {
        case UserGroupsActionType.FETCH_USER_GROUPS_INIT: {
            return {
                ...previousState,
                allGroups: [],
                availableGroups: [],
                isLoading: true,
                userGroups: [],
            }
        }

        case UserGroupsActionType.FETCH_USER_GROUPS_DONE: {
            const userGroups = _.orderBy(action.payload[0], ['name'], ['asc'])
            const allGroups = action.payload[1]
            return {
                ...previousState,
                allGroups,
                availableGroups: getAvailableGroups(userGroups, allGroups),
                isLoading: false,
                userGroups,
            }
        }

        case UserGroupsActionType.FETCH_USER_GROUPS_FAILED: {
            return {
                ...previousState,
                isLoading: false,
            }
        }

        case UserGroupsActionType.ADD_USER_GROUP_INIT: {
            return {
                ...previousState,
                isAdding: true,
            }
        }

        case UserGroupsActionType.ADD_USER_GROUP_DONE: {
            const newGroup = _.find(previousState.availableGroups, {
                id: action.payload,
            })
            const userGroups = _.orderBy(
                [...previousState.userGroups, ...(newGroup ? [newGroup] : [])],
                ['name'],
                ['asc'],
            )
            return {
                ...previousState,
                availableGroups: getAvailableGroups(
                    userGroups,
                    previousState.allGroups,
                ),
                isAdding: false,
                userGroups,
            }
        }

        case UserGroupsActionType.ADD_USER_GROUP_FAILED: {
            return {
                ...previousState,
                isAdding: false,
            }
        }

        case UserGroupsActionType.REMOVE_USER_GROUP_INIT: {
            return {
                ...previousState,
                isRemoving: {
                    ...previousState.isRemoving,
                    [action.payload]: true,
                },
            }
        }

        case UserGroupsActionType.REMOVE_USER_GROUP_DONE: {
            const userGroups = _.filter(
                previousState.userGroups,
                group => group.id !== action.payload,
            )
            return {
                ...previousState,
                availableGroups: getAvailableGroups(
                    userGroups,
                    previousState.allGroups,
                ),
                isRemoving: {
                    ...previousState.isRemoving,
                    [action.payload]: false,
                },
                userGroups,
            }
        }

        case UserGroupsActionType.REMOVE_USER_GROUP_FAILED: {
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

export interface useManageUserGroupsProps {
    isLoading: boolean
    isRemoving: { [key: string]: boolean }
    isAdding: boolean
    userGroups: UserGroup[]
    availableGroups: UserGroup[]
    doAddGroup: (newGroupId: string, success?: () => void) => void
    doRemoveGroup: (group: UserGroup) => void
}

/**
 * Manage user groups redux state
 * @param userInfo user info
 * @returns state data
 */
export function useManageUserGroups(
    userInfo: UserInfo,
): useManageUserGroupsProps {
    const [state, dispatch] = useReducer(reducer, {
        allGroups: [],
        availableGroups: [],
        isAdding: false,
        isLoading: false,
        isRemoving: {},
        userGroups: [],
    })

    const doFetchUserGroups = useCallback(() => {
        dispatch({
            type: UserGroupsActionType.FETCH_USER_GROUPS_INIT,
        })
        Promise.all([
            findByMember({
                memberId: userInfo.id,
                membershipType: 'user',
                page: PAGE,
                perPage: PER_PAGE,
            }),
            fetchGroups({
                page: PAGE,
                perPage: PER_PAGE,
            }),
        ])
            .then(result => {
                dispatch({
                    payload: result,
                    type: UserGroupsActionType.FETCH_USER_GROUPS_DONE,
                })
            })
            .catch(e => {
                dispatch({
                    type: UserGroupsActionType.FETCH_USER_GROUPS_FAILED,
                })
                handleError(e)
            })
    }, [dispatch, userInfo])

    const doAddGroup = useCallback(
        (newGroupId: string, success?: () => void) => {
            dispatch({
                type: UserGroupsActionType.ADD_USER_GROUP_INIT,
            })
            addMember(newGroupId, {
                memberId: userInfo.id,
                membershipType: 'user',
            })
                .then(() => {
                    toast.success('Group added successfully', {
                        toastId: 'Add group',
                    })
                    dispatch({
                        payload: newGroupId,
                        type: UserGroupsActionType.ADD_USER_GROUP_DONE,
                    })
                    success?.()
                })
                .catch(e => {
                    dispatch({
                        type: UserGroupsActionType.ADD_USER_GROUP_FAILED,
                    })
                    handleError(e)
                })
        },
        [dispatch, userInfo],
    )

    const doRemoveGroup = useCallback(
        (group: UserGroup) => {
            dispatch({
                payload: group.id,
                type: UserGroupsActionType.REMOVE_USER_GROUP_INIT,
            })

            // to delete a member from a group we have to know membership id
            // the only way to get it is to get all membership records of the group
            // and then find the one for current user
            fetchGroupMembers(group.id, {
                page: PAGE,
                perPage: PER_PAGE,
            })
                .then(memberships => {
                    const membership = _.find(
                        memberships,
                        // as memberId is a string and user.id is a number
                        // it's safer to convert memberId to a string,
                        // because when converting to a number there lots of issues can appear
                        (item: UserGroupMember) => item.memberId.toString() === userInfo.id,
                    )

                    if (!membership) {
                        // if user is already not a member, show warning but remove group from the list
                        toast.warning(
                            `User is already not a member of the group ${group.name}.`,
                            {
                                toastId: 'Remove group',
                            },
                        )
                        dispatch({
                            payload: group.id,
                            type: UserGroupsActionType.REMOVE_USER_GROUP_DONE,
                        })
                    } else {
                        removeMember(group.id, membership.memberId)
                            .then(() => {
                                toast.success('Group removed successfully', {
                                    toastId: 'Remove group',
                                })
                                dispatch({
                                    payload: group.id,
                                    type: UserGroupsActionType.REMOVE_USER_GROUP_DONE,
                                })
                            })
                            .catch(e => {
                                dispatch({
                                    payload: group.id,
                                    type: UserGroupsActionType.REMOVE_USER_GROUP_FAILED,
                                })
                                handleError(e)
                            })
                    }
                })
                .catch(e => {
                    dispatch({
                        payload: group.id,
                        type: UserGroupsActionType.REMOVE_USER_GROUP_FAILED,
                    })
                    handleError(e)
                })
        },
        [dispatch, userInfo],
    )

    useOnComponentDidMount(() => {
        doFetchUserGroups()
    })

    return {
        availableGroups: state.availableGroups,
        doAddGroup,
        doRemoveGroup,
        isAdding: state.isAdding,
        isLoading: state.isLoading,
        isRemoving: state.isRemoving,
        userGroups: state.userGroups,
    }
}
