/**
 * Manage Challenge Resources
 */
import {
    Dispatch,
    SetStateAction,
    useCallback,
    useMemo,
    useReducer,
} from 'react'
import { toast } from 'react-toastify'
import _ from 'lodash'

import { Sort } from '~/apps/gamification-admin/src/game-lib'

import { TABLE_PAGINATION_ITEM_PER_PAGE } from '../../config/index.config'
import {
    adjustChallengeResource,
    ChallengeResource,
    IsRemovingType,
} from '../models'
import { deleteChallengeResource, getChallengeResources } from '../services'
import { handleError } from '../utils'

import {
    useTableFilterBackend,
    useTableFilterBackendProps,
} from './useTableFilterBackend'

/// /////////////////
// Permission resources reducer
/// ////////////////

type ResourceState = {
    isLoading: boolean
    resources: ChallengeResource[]
    totalPages: number
    isRemoving: IsRemovingType
}

const ResourceActionType = {
    FETCH_RESOURCES_DONE: 'FETCH_RESOURCES_DONE' as const,
    FETCH_RESOURCES_FAILED: 'FETCH_RESOURCES_FAILED' as const,
    FETCH_RESOURCES_INIT: 'FETCH_RESOURCES_INIT' as const,
    REMOVE_RESOURCES_DONE: 'REMOVE_RESOURCES_DONE' as const,
    REMOVE_RESOURCES_FAILED: 'REMOVE_RESOURCES_FAILED' as const,
    REMOVE_RESOURCES_INIT: 'REMOVE_RESOURCES_INIT' as const,
}

type ResourceReducerAction =
    | {
          type:
              | typeof ResourceActionType.FETCH_RESOURCES_INIT
              | typeof ResourceActionType.FETCH_RESOURCES_FAILED
      }
    | {
          type: typeof ResourceActionType.FETCH_RESOURCES_DONE
          payload: {
              data: ChallengeResource[]
              totalPages: number
          }
      }
    | {
          type:
              | typeof ResourceActionType.REMOVE_RESOURCES_DONE
              | typeof ResourceActionType.REMOVE_RESOURCES_INIT
              | typeof ResourceActionType.REMOVE_RESOURCES_FAILED
          payload: number
      }

const reducer = (
    previousState: ResourceState,
    action: ResourceReducerAction,
): ResourceState => {
    switch (action.type) {
        case ResourceActionType.FETCH_RESOURCES_INIT: {
            return {
                ...previousState,
                isLoading: true,
                resources: [],
            }
        }

        case ResourceActionType.FETCH_RESOURCES_DONE: {
            const payload = action.payload
            return {
                ...previousState,
                isLoading: false,
                resources: payload.data,
                totalPages: payload.totalPages,
            }
        }

        case ResourceActionType.FETCH_RESOURCES_FAILED: {
            return {
                ...previousState,
                isLoading: false,
            }
        }

        case ResourceActionType.REMOVE_RESOURCES_INIT: {
            return {
                ...previousState,
                isRemoving: {
                    ...previousState.isRemoving,
                    [action.payload]: true,
                },
            }
        }

        case ResourceActionType.REMOVE_RESOURCES_DONE: {
            return {
                ...previousState,
                isRemoving: {
                    ...previousState.isRemoving,
                    [action.payload]: false,
                },
            }
        }

        case ResourceActionType.REMOVE_RESOURCES_FAILED: {
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

export interface useManageChallengeResourcesProps {
    isLoading: boolean
    resources: ChallengeResource[]
    totalPages: number
    page: number
    setPage: Dispatch<SetStateAction<number>>
    sort: Sort | undefined
    setSort: Dispatch<SetStateAction<Sort | undefined>>
    isRemoving: IsRemovingType
    isRemovingBool: boolean
    doRemoveResource: (data: ChallengeResource) => void
}

/**
 * Manage permission resources redux state
 * @param challengeId challenge id
 * @param mappingSortField mapping from property field to sort field
 * @returns state data
 */
export function useManageChallengeResources(
    challengeId: string,
    mappingSortField?: {
        [key: string]: string
    },
): useManageChallengeResourcesProps {
    const [state, dispatch] = useReducer(reducer, {
        isLoading: false,
        isRemoving: {},
        resources: [],
        totalPages: 1,
    })
    const isRemovingBool = useMemo(
        () => _.some(state.isRemoving, value => value === true),
        [state.isRemoving],
    )
    const { page, setPage, sort, setSort, setFilterCriteria }: useTableFilterBackendProps<{}>
        = useTableFilterBackend<{}>(
            (pageRequest, sortRequest, filterCriteria, success, fail) => {
                if (challengeId) {
                    dispatch({
                        type: ResourceActionType.FETCH_RESOURCES_INIT,
                    })
                    let sortFieldName = sortRequest?.fieldName
                    if (
                        mappingSortField
                        && sortFieldName
                        && mappingSortField[sortFieldName]
                    ) {
                        sortFieldName = mappingSortField[sortFieldName]
                    }

                    getChallengeResources(challengeId, {
                        page: pageRequest,
                        perPage: TABLE_PAGINATION_ITEM_PER_PAGE,
                        ...sortRequest ? {
                            sortBy: sortFieldName,
                            sortOrder: sortRequest.direction,
                        } : {},
                    })
                        .then(result => {
                            dispatch({
                                payload: {
                                    data: result.data.map(
                                        adjustChallengeResource,
                                    ),
                                    totalPages: result.totalPages,
                                },
                                type: ResourceActionType.FETCH_RESOURCES_DONE,
                            })
                            success()
                        })
                        .catch(e => {
                            dispatch({
                                type: ResourceActionType.FETCH_RESOURCES_FAILED,
                            })
                            handleError(e)
                            fail()
                        })
                } else {
                    fail()
                }
            },
            {},
        )

    const doRemoveResource = useCallback(
        (item: ChallengeResource) => {
            dispatch({
                payload: item.id,
                type: ResourceActionType.REMOVE_RESOURCES_INIT,
            })
            function handleActionError(error: any): void {
                dispatch({
                    payload: item.id,
                    type: ResourceActionType.REMOVE_RESOURCES_FAILED,
                })
                handleError(error)
            }

            deleteChallengeResource({
                challengeId,
                memberHandle: item.memberHandle,
                roleId: item.roleId,
            })
                .then(() => {
                    toast.success('Resource removed successfully', {
                        toastId: 'Remove resource',
                    })
                    dispatch({
                        payload: item.id,
                        type: ResourceActionType.REMOVE_RESOURCES_DONE,
                    })
                    setFilterCriteria({}) // fetch table data again
                })
                .catch(handleActionError)
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [dispatch, challengeId],
    )

    return {
        doRemoveResource,
        isLoading: state.isLoading,
        isRemoving: state.isRemoving,
        isRemovingBool,
        page,
        resources: state.resources,
        setPage,
        setSort,
        sort,
        totalPages: state.totalPages,
    }
}
