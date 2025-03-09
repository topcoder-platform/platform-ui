/**
 * Manage permission roles redux state
 */
import { useCallback, useEffect, useReducer } from 'react'
import { toast } from 'react-toastify'
import _ from 'lodash'

import {
    TableFilterType,
    UserIdType,
    UserMappingType,
    UserRole,
} from '../models'
import { createRole, fetchRoles } from '../services'
import { handleError } from '../utils'

import { useOnComponentDidMount } from './useOnComponentDidMount'

/// /////////////////
// Permission roles reducer
/// ////////////////

type RolesState = {
    isLoading: boolean
    isAdding: boolean
    allRoles: UserRole[]
    filteredRoles: UserRole[]
}

const RolesActionType = {
    ADD_ROLES_DONE: 'ADD_ROLES_DONE' as const,
    ADD_ROLES_FAILED: 'ADD_ROLES_FAILED' as const,
    ADD_ROLES_INIT: 'ADD_ROLES_INIT' as const,
    FETCH_ROLES_DONE: 'FETCH_ROLES_DONE' as const,
    FETCH_ROLES_FAILED: 'FETCH_ROLES_FAILED' as const,
    FETCH_ROLES_INIT: 'FETCH_ROLES_INIT' as const,
    FILTER_ROLES_DONE: 'FILTER_ROLES_DONE' as const,
}

type RolesReducerAction =
    | {
          type:
              | typeof RolesActionType.ADD_ROLES_DONE
              | typeof RolesActionType.ADD_ROLES_INIT
              | typeof RolesActionType.ADD_ROLES_FAILED
              | typeof RolesActionType.FETCH_ROLES_INIT
              | typeof RolesActionType.FETCH_ROLES_FAILED
      }
    | {
          type:
              | typeof RolesActionType.FETCH_ROLES_DONE
              | typeof RolesActionType.FILTER_ROLES_DONE
          payload: UserRole[]
      }

const reducer = (
    previousState: RolesState,
    action: RolesReducerAction,
): RolesState => {
    switch (action.type) {
        case RolesActionType.FETCH_ROLES_INIT: {
            return {
                ...previousState,
                allRoles: [],
                filteredRoles: [],
                isLoading: true,
            }
        }

        case RolesActionType.FETCH_ROLES_DONE: {
            const allRoles = action.payload
            return {
                ...previousState,
                allRoles,
                filteredRoles: allRoles,
                isLoading: false,
            }
        }

        case RolesActionType.FILTER_ROLES_DONE: {
            const filteredRoles = action.payload
            return {
                ...previousState,
                filteredRoles,
            }
        }

        case RolesActionType.FETCH_ROLES_FAILED: {
            return {
                ...previousState,
                isLoading: false,
            }
        }

        case RolesActionType.ADD_ROLES_INIT: {
            return {
                ...previousState,
                isAdding: true,
            }
        }

        case RolesActionType.ADD_ROLES_DONE: {
            return {
                ...previousState,
                isAdding: false,
            }
        }

        case RolesActionType.ADD_ROLES_FAILED: {
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

export interface useManagePermissionRolesProps {
    isLoading: boolean
    isAdding: boolean
    roles: UserRole[]
    doAddRole: (roleName: string, success: () => void) => void
    doFilterRole: (filterData: TableFilterType) => void
}

/**
 * Manage permission roles redux state
 * @param loadUsers load list of users function
 * @param usersMapping mapping user id to user handle
 * @returns state data
 */
export function useManagePermissionRoles(
    loadUser: (userId: UserIdType) => void,
    usersMapping: UserMappingType, // from user id to user handle
): useManagePermissionRolesProps {
    const [state, dispatch] = useReducer(reducer, {
        allRoles: [],
        filteredRoles: [],
        isAdding: false,
        isLoading: false,
    })

    const doFetchRoles = useCallback(() => {
        dispatch({
            type: RolesActionType.FETCH_ROLES_INIT,
        })
        fetchRoles()
            .then(result => {
                dispatch({
                    payload: result,
                    type: RolesActionType.FETCH_ROLES_DONE,
                })
                _.forEach(result, role => {
                    if (role.createdBy) {
                        loadUser(role.createdBy)
                    }

                    if (role.modifiedBy) {
                        loadUser(role.modifiedBy)
                    }
                })
            })
            .catch(e => {
                dispatch({
                    type: RolesActionType.FETCH_ROLES_FAILED,
                })
                handleError(e)
            })
    }, [dispatch, loadUser])

    const doAddRole = useCallback(
        (roleName: string, success: () => void) => {
            dispatch({
                type: RolesActionType.ADD_ROLES_INIT,
            })
            function handleSuccess(): void {
                toast.success('Role added successfully', {
                    toastId: 'Add role',
                })
                dispatch({
                    type: RolesActionType.ADD_ROLES_DONE,
                })
                success()
            }

            createRole(roleName)
                .then(() => {
                    setTimeout(() => {
                        handleSuccess()
                        doFetchRoles() // sometimes the backend does not return the new data
                        // so I added a 1 second timeout for this
                    }, 1000)
                })
                .catch(e => {
                    dispatch({
                        type: RolesActionType.ADD_ROLES_FAILED,
                    })
                    handleError(e)
                })
        },
        [dispatch, doFetchRoles],
    )

    const doFilterRole = useCallback(
        (filterData: TableFilterType) => {
            const datas = state.allRoles
            const results = _.filter(datas, data => {
                let isMatched = false
                // eslint-disable-next-line consistent-return
                _.forOwn(filterData, (value, key) => {
                    if (value) {
                        const valueData = `${_.get(data, key)}`.toLowerCase()
                        const escapedSearchText = _.escapeRegExp(
                            `${value}`.toLowerCase(),
                        )
                        if (
                            new RegExp(escapedSearchText, 'i')
                                .test(valueData)
                        ) {
                            isMatched = true
                            return false
                        }
                    } else {
                        isMatched = true
                        return false
                    }
                })
                return isMatched
            })

            dispatch({
                payload: results,
                type: RolesActionType.FILTER_ROLES_DONE,
            })
        },
        [dispatch, state.allRoles],
    )

    useOnComponentDidMount(() => {
        doFetchRoles()
    })

    useEffect(() => {
        _.forEach(state.allRoles, role => {
            if (role.createdBy) {
                role.createdByHandle = usersMapping[role.createdBy]
            }

            if (role.modifiedBy) {
                role.modifiedByHandle = usersMapping[role.modifiedBy]
            }
        })
    }, [usersMapping, state.allRoles])

    return {
        doAddRole,
        doFilterRole,
        isAdding: state.isAdding,
        isLoading: state.isLoading,
        roles: state.filteredRoles,
    }
}
