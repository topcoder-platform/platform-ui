/**
 * Manage terms users redux state
 */
import {
    Dispatch,
    SetStateAction,
    useCallback,
    useEffect,
    useMemo,
    useReducer,
    useRef,
    useState,
} from 'react'
import { toast } from 'react-toastify'
import _ from 'lodash'

import { PaginatedResponse } from '~/libs/core'

import { TABLE_PAGINATION_ITEM_PER_PAGE } from '../../config/index.config'
import {
    FormTermsUsersFilter,
    TermUserInfo,
    UserIdType,
    UserTerm,
} from '../models'
import { handleError } from '../utils'
import {
    addUserTerm,
    fetchAllTermsUsers,
    findTermsById,
    getProfile,
    removeTermUser,
} from '../services'

import {
    useTableFilterBackend,
    useTableFilterBackendProps,
} from './useTableFilterBackend'

/// /////////////////
// Terms users reducer
/// ////////////////

type TermsState = {
    isLoading: boolean
    datas: TermUserInfo[]
    totalPages: number
    isRemoving: { [key: string]: boolean }
}

const TermsActionType = {
    FETCH_TERMS_USERS_DONE: 'FETCH_TERMS_USERS_DONE' as const,
    FETCH_TERMS_USERS_FAILED: 'FETCH_TERMS_USERS_FAILED' as const,
    FETCH_TERMS_USERS_INIT: 'FETCH_TERMS_USERS_INIT' as const,
    REMOVE_TERMS_USERS_DONE: 'REMOVE_TERMS_USERS_DONE' as const,
    REMOVE_TERMS_USERS_FAILED: 'REMOVE_TERMS_USERS_FAILED' as const,
    REMOVE_TERMS_USERS_INIT: 'REMOVE_TERMS_USERS_INIT' as const,
}

type TermsReducerAction =
    | {
          type:
              | typeof TermsActionType.FETCH_TERMS_USERS_INIT
              | typeof TermsActionType.FETCH_TERMS_USERS_FAILED
      }
    | {
          type: typeof TermsActionType.FETCH_TERMS_USERS_DONE
          payload: {
              data: TermUserInfo[]
              totalPages: number
          }
      }
    | {
          type:
              | typeof TermsActionType.REMOVE_TERMS_USERS_DONE
              | typeof TermsActionType.REMOVE_TERMS_USERS_INIT
              | typeof TermsActionType.REMOVE_TERMS_USERS_FAILED
          payload: number
      }

const reducer = (
    previousState: TermsState,
    action: TermsReducerAction,
): TermsState => {
    switch (action.type) {
        case TermsActionType.FETCH_TERMS_USERS_INIT: {
            return {
                ...previousState,
                isLoading: true,
            }
        }

        case TermsActionType.FETCH_TERMS_USERS_DONE: {
            return {
                ...previousState,
                datas: action.payload.data,
                isLoading: false,
                totalPages: action.payload.totalPages,
            }
        }

        case TermsActionType.FETCH_TERMS_USERS_FAILED: {
            return {
                ...previousState,
                isLoading: false,
            }
        }

        case TermsActionType.REMOVE_TERMS_USERS_INIT: {
            return {
                ...previousState,
                isRemoving: {
                    ...previousState.isRemoving,
                    [action.payload]: true,
                },
            }
        }

        case TermsActionType.REMOVE_TERMS_USERS_DONE: {
            return {
                ...previousState,
                datas: previousState.datas.filter(
                    item => `${item.userId}` !== `${action.payload}`,
                ),
                isRemoving: {
                    ...previousState.isRemoving,
                    [action.payload]: false,
                },
            }
        }

        case TermsActionType.REMOVE_TERMS_USERS_FAILED: {
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

export interface useManageTermsUsersProps {
    datas: TermUserInfo[]
    isAdding: boolean
    isLoading: boolean
    isLoadingTerm: boolean
    page: number
    setPage: Dispatch<SetStateAction<number>>
    setFilterCriteria: (criteria: FormTermsUsersFilter | undefined) => void
    totalPages: number
    isRemovingBool: boolean
    isRemoving: { [key: string]: boolean }
    doRemoveTermUser: (userId: number) => void
    doRemoveTermUsers: (userIds: number[], callBack: () => void) => void
    doAddTermUser: (
        userId: number,
        userHandle: string,
        sucess: () => void,
        fail: () => void,
    ) => void
    termInfo?: UserTerm
}

/**
 * Manage terms users redux state
 * @param termsId terms id
 * @param loadUsers load list of users function
 * @param cancelLoadUser cancel load users
 * @returns state data
 */
export function useManageTermsUsers(
    termsId: string,
    loadUser: (userId: UserIdType) => void,
    cancelLoadUser: () => void,
): useManageTermsUsersProps {
    const [isAdding, setIsAdding] = useState(false)
    const [termInfo, setTermInfo] = useState<UserTerm>()
    const [state, dispatch] = useReducer(reducer, {
        datas: [],
        isLoading: false,
        isRemoving: {},
        totalPages: 1,
    })
    const isRemovingBool = useMemo(
        () => _.some(state.isRemoving, value => value === true),
        [state.isRemoving],
    )
    const [isLoadingTerm, setIsLoadingTerm] = useState(false)
    const isLoadingTermRef = useRef(false)

    /**
     * Cancel load user when component is destroyed
     */
    useEffect(
        () => () => {
            // clear queue of currently loading user handles after exit ui
            cancelLoadUser()
        },
        [cancelLoadUser],
    )

    /**
     * Fetch term info
     */
    const doFetchTerm = useCallback(() => {
        if (!isLoadingTermRef.current && termsId) {
            isLoadingTermRef.current = true
            setIsLoadingTerm(isLoadingTermRef.current)
            findTermsById(termsId)
                .then(termInfoResult => {
                    setTermInfo(termInfoResult)

                    isLoadingTermRef.current = false
                    setIsLoadingTerm(isLoadingTermRef.current)
                })
                .catch(e => {
                    isLoadingTermRef.current = false
                    setIsLoadingTerm(isLoadingTermRef.current)
                    handleError(e)
                })
        }
    }, [termsId])

    /**
     * Fetch term info on init
     */
    useEffect(() => {
        doFetchTerm()
    }, [doFetchTerm])

    /**
     * Handle backend call for pagination, filtering
     */
    const {
        page,
        setPage,
        setFilterCriteria,
        reloadData,
    }: useTableFilterBackendProps<FormTermsUsersFilter>
        = useTableFilterBackend<FormTermsUsersFilter>(
            (pagRequest, sortRequest, filterCriteria, success, fail) => {
                if (!termsId) {
                    fail()
                    return
                }

                dispatch({
                    type: TermsActionType.FETCH_TERMS_USERS_INIT,
                })
                const requestSuccess = (data: number[], totalPages: number): void => {
                    dispatch({
                        payload: {
                            data: data.map(item => ({
                                userId: item,
                            })),
                            totalPages,
                        },
                        type: TermsActionType.FETCH_TERMS_USERS_DONE,
                    })
                    success()
                    window.scrollTo({ left: 0, top: 0 })
                }

                const requestFail = (error: any): void => {
                    dispatch({
                        type: TermsActionType.FETCH_TERMS_USERS_FAILED,
                    })
                    handleError(error)
                    fail()
                }

                let filter = `page=${pagRequest}&perPage=${TABLE_PAGINATION_ITEM_PER_PAGE}`

                if (
                    filterCriteria?.userId
                    && filterCriteria?.userId.toString()
                        .trim()
                ) {
                    filter += `&userId=${filterCriteria.userId}`
                }

                if (filterCriteria?.signTermsFrom) {
                    filter += `&signedAtFrom=${filterCriteria.signTermsFrom.toISOString()}`
                }

                if (filterCriteria?.signTermsTo) {
                    filter += `&signedAtTo=${filterCriteria.signTermsTo.toISOString()}`
                }

                if (filterCriteria?.handle && filterCriteria?.handle.trim()) {
                    if (
                        filterCriteria?.userId
                        && filterCriteria?.userId.toString()
                            .trim()
                    ) {
                        getProfile(filterCriteria?.handle)
                            .then(profileData => {
                                if (
                                    `${profileData.userId}`
                                    !== filterCriteria?.userId
                                ) {
                                    requestSuccess([], 0)
                                } else {
                                    fetchAllTermsUsers(termsId, filter)
                                        .then(data => {
                                            requestSuccess(
                                                data.data.result,
                                                data.totalPages,
                                            )
                                        })
                                        .catch(requestFail)
                                }
                            })
                            .catch(error => {
                                dispatch({
                                    type: TermsActionType.FETCH_TERMS_USERS_FAILED,
                                })
                                handleError(error)
                                fail()
                            })
                    } else {
                        getProfile(filterCriteria?.handle)
                            .then(profileData => {
                                filter += `&userId=${profileData.userId}`
                                fetchAllTermsUsers(termsId, filter)
                                    .then(data => {
                                        requestSuccess(
                                            data.data.result,
                                            data.totalPages,
                                        )
                                    })
                                    .catch(requestFail)
                            })
                            .catch(requestFail)
                    }
                } else {
                    fetchAllTermsUsers(termsId, filter)
                        .then((
                            data: PaginatedResponse<{
                                result: number[]
                            }>,
                        ) => requestSuccess(data.data.result, data.totalPages))
                        .catch(requestFail)
                }
            },
            {},
        )

    /**
     * Remove term user
     */
    const doRemoveTermUser = useCallback(
        (userId: number) => {
            dispatch({
                payload: userId,
                type: TermsActionType.REMOVE_TERMS_USERS_INIT,
            })
            removeTermUser(termsId, `${userId}`)
                .then(() => {
                    toast.success('User removed successfully', {
                        toastId: 'Remove term user',
                    })

                    dispatch({
                        payload: userId,
                        type: TermsActionType.REMOVE_TERMS_USERS_DONE,
                    })
                })
                .catch(e => {
                    dispatch({
                        payload: userId,
                        type: TermsActionType.REMOVE_TERMS_USERS_FAILED,
                    })
                    handleError(e)
                })
        },
        [dispatch, termsId],
    )

    /**
     * Remove list of term user
     */
    const doRemoveTermUsers = useCallback(
        (userIds: number[], callBack: () => void) => {
            let hasErrors = false
            _.forEach(userIds, userId => {
                dispatch({
                    payload: userId,
                    type: TermsActionType.REMOVE_TERMS_USERS_INIT,
                })
            })
            Promise.all(
                userIds.map(async userId => removeTermUser(
                    termsId,
                    `${userId}`,
                )
                    .catch(e => {
                        hasErrors = true
                        handleError(e)
                    })),
            )
                .then(() => {
                    if (!hasErrors) {
                        toast.success(
                            `${
                                userIds.length > 1 ? 'Users' : 'User'
                            } removed successfully`,
                            {
                                toastId: 'Remove term users',
                            },
                        )
                        callBack()
                    }

                    _.forEach(userIds, userId => {
                        dispatch({
                            payload: userId,
                            type: TermsActionType.REMOVE_TERMS_USERS_DONE,
                        })
                    })
                })
                .catch(e => {
                    _.forEach(userIds, userId => {
                        dispatch({
                            payload: userId,
                            type: TermsActionType.REMOVE_TERMS_USERS_FAILED,
                        })
                    })
                    handleError(e)
                })
        },
        [dispatch, termsId],
    )

    /**
     * Add term user
     */
    const doAddTermUser = useCallback(
        (
            userId: number,
            userHandle: string,
            sucess: () => void,
            fail: () => void,
        ) => {
            setIsAdding(true)
            addUserTerm(termsId, `${userId}`)
                .then(() => {
                    toast.success(
                        `Terms Added Successfullly to user ${userHandle}`,
                        {
                            toastId: 'Add term user',
                        },
                    )
                    setIsAdding(false)
                    reloadData()
                    sucess()
                })
                .catch(e => {
                    setIsAdding(false)
                    handleError(e)
                    fail()
                })
        },
        [termsId, reloadData],
    )

    useEffect(() => {
        _.forEach(state.datas, termUser => {
            loadUser(termUser.userId)
        })

        // Check to reload table data after removing
        if (state.totalPages > 1 && !isRemovingBool) {
            if (page === state.totalPages) {
                if (!state.datas.length) {
                    // move to new last page after remove item
                    setPage(state.totalPages - 1)
                }
            } else if (state.datas.length < TABLE_PAGINATION_ITEM_PER_PAGE) {
                // reload data after removing success
                reloadData()
            }
        }
    }, [state.datas])

    return {
        datas: state.datas,
        doAddTermUser,
        doRemoveTermUser,
        doRemoveTermUsers,
        isAdding,
        isLoading: state.isLoading,
        isLoadingTerm,
        isRemoving: state.isRemoving,
        isRemovingBool,
        page,
        setFilterCriteria,
        setPage,
        termInfo,
        totalPages: state.totalPages,
    }
}
