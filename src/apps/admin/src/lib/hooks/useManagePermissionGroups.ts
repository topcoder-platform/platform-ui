/**
 * Manage permission groups redux state
 */
import { useCallback, useEffect, useReducer } from 'react'
import { toast } from 'react-toastify'
import _ from 'lodash'

import { FormAddGroup, UserGroup, UserIdType, UserMappingType } from '../models'
import { createGroup, fetchGroups } from '../services'
import { handleError } from '../utils'

import { useOnComponentDidMount } from './useOnComponentDidMount'

/// /////////////////
// Permission groups reducer
/// ////////////////

type GroupsState = {
    isLoading: boolean
    isAdding: boolean
    groups: UserGroup[]
}

// used to get all groups
const PAGE = 1
const PER_PAGE = 4000

const GroupsActionType = {
    ADD_GROUPS_DONE: 'ADD_GROUPS_DONE' as const,
    ADD_GROUPS_FAILED: 'ADD_GROUPS_FAILED' as const,
    ADD_GROUPS_INIT: 'ADD_GROUPS_INIT' as const,
    FETCH_GROUPS_DONE: 'FETCH_GROUPS_DONE' as const,
    FETCH_GROUPS_FAILED: 'FETCH_GROUPS_FAILED' as const,
    FETCH_GROUPS_INIT: 'FETCH_GROUPS_INIT' as const,
}

type GroupsReducerAction =
    | {
          type:
              | typeof GroupsActionType.ADD_GROUPS_DONE
              | typeof GroupsActionType.ADD_GROUPS_INIT
              | typeof GroupsActionType.ADD_GROUPS_FAILED
              | typeof GroupsActionType.FETCH_GROUPS_INIT
              | typeof GroupsActionType.FETCH_GROUPS_FAILED
      }
    | {
          type: typeof GroupsActionType.FETCH_GROUPS_DONE
          payload: UserGroup[]
      }

const reducer = (
    previousState: GroupsState,
    action: GroupsReducerAction,
): GroupsState => {
    switch (action.type) {
        case GroupsActionType.FETCH_GROUPS_INIT: {
            return {
                ...previousState,
                groups: [],
                isLoading: true,
            }
        }

        case GroupsActionType.FETCH_GROUPS_DONE: {
            const groups = action.payload
            return {
                ...previousState,
                groups,
                isLoading: false,
            }
        }

        case GroupsActionType.FETCH_GROUPS_FAILED: {
            return {
                ...previousState,
                isLoading: false,
            }
        }

        case GroupsActionType.ADD_GROUPS_INIT: {
            return {
                ...previousState,
                isAdding: true,
            }
        }

        case GroupsActionType.ADD_GROUPS_DONE: {
            return {
                ...previousState,
                isAdding: false,
            }
        }

        case GroupsActionType.ADD_GROUPS_FAILED: {
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

export interface useManagePermissionGroupsProps {
    isLoading: boolean
    isAdding: boolean
    groups: UserGroup[]
    doAddGroup: (groupInfo: FormAddGroup, success: () => void) => void
}

/**
 * Manage permission groups redux state
 * @param loadUsers load list of users function
 * @param cancelLoadUser cancel load users
 * @param usersMapping mapping user id to user handle
 * @returns state data
 */
export function useManagePermissionGroups(
    loadUser: (userId: UserIdType) => void,
    cancelLoadUser: () => void,
    usersMapping: UserMappingType, // from user id to user handle
): useManagePermissionGroupsProps {
    const [state, dispatch] = useReducer(reducer, {
        groups: [],
        isAdding: false,
        isLoading: false,
    })

    const doFetchGroups = useCallback(() => {
        dispatch({
            type: GroupsActionType.FETCH_GROUPS_INIT,
        })
        fetchGroups({
            page: PAGE,
            perPage: PER_PAGE,
        })
            .then(result => {
                dispatch({
                    payload: result,
                    type: GroupsActionType.FETCH_GROUPS_DONE,
                })
                _.forEach(result, group => {
                    if (group.createdBy) {
                        loadUser(group.createdBy)
                    } else {
                        group.createdByHandle = ''
                    }

                    if (group.updatedBy) {
                        loadUser(group.updatedBy)
                    } else {
                        group.updatedByHandle = ''
                    }
                })
            })
            .catch(e => {
                dispatch({
                    type: GroupsActionType.FETCH_GROUPS_FAILED,
                })
                handleError(e)
            })
    }, [dispatch, loadUser])

    const doAddGroup = useCallback(
        (groupInfo: FormAddGroup, success: () => void) => {
            dispatch({
                type: GroupsActionType.ADD_GROUPS_INIT,
            })
            function handleSuccess(): void {
                toast.success('Group added successfully', {
                    toastId: 'Add group',
                })
                dispatch({
                    type: GroupsActionType.ADD_GROUPS_DONE,
                })
                success()
            }

            createGroup(groupInfo)
                .then(() => {
                    setTimeout(() => {
                        handleSuccess()
                        doFetchGroups()
                    }, 1000) // sometimes the backend does not return the new data
                    // so I added a 1 second timeout for this
                })
                .catch(e => {
                    dispatch({
                        type: GroupsActionType.ADD_GROUPS_FAILED,
                    })
                    handleError(e)
                })
        },
        [dispatch, doFetchGroups],
    )

    useOnComponentDidMount(() => {
        doFetchGroups()
    })

    useEffect(() => () => {
        // clear queue of currently loading user handles after exit ui
        cancelLoadUser()
    }, [cancelLoadUser])

    useEffect(() => {
        _.forEach(state.groups, group => {
            if (group.createdBy) {
                group.createdByHandle = usersMapping[group.createdBy]
            }

            if (group.updatedBy) {
                group.updatedByHandle = usersMapping[group.updatedBy]
            }
        })
    }, [usersMapping, state.groups])

    return {
        doAddGroup,
        groups: state.groups,
        isAdding: state.isAdding,
        isLoading: state.isLoading,
    }
}
