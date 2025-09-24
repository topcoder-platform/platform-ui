/**
 * Manage user terms redux state
 */
import {
    Dispatch,
    SetStateAction,
    useCallback,
    useEffect,
    useReducer,
    useRef,
    useState,
} from 'react'
import { toast } from 'react-toastify'

import {
    TABLE_USER_TEMRS_PAGINATION_ITEM_PER_PAGE,
} from '../../config/index.config'
import { UserInfo, UserTerm } from '../models'
import { addUserTerm, fetchAllTerms, removeTermUser } from '../services'
import { handleError } from '../utils'

/// /////////////////
// User terms reducer
/// ////////////////

type UserTermsState = {
    isLoadingAddedTerm: boolean
    addedDatas: UserTerm[]
    addedTotalPage: number
    isLoadingNotAddedTerm: boolean
    notAddedDatas: UserTerm[]
    notAddedTotalPage: number
    isRemoving: { [key: string]: boolean }
    isAdding: { [key: string]: boolean }
}

const UserTermsActionType = {
    ADD_TERM_DONE: 'ADD_TERM_DONE' as const,
    ADD_TERM_FAILED: 'ADD_TERM_FAILED' as const,
    ADD_TERM_INIT: 'ADD_TERM_INIT' as const,
    FETCH_ADDED_USER_TERMS_DONE: 'FETCH_ADDED_USER_TERMS_DONE' as const,
    FETCH_ADDED_USER_TERMS_FAILED: 'FETCH_ADDED_USER_TERMS_FAILED' as const,
    FETCH_ADDED_USER_TERMS_INIT: 'FETCH_ADDED_USER_TERMS_INIT' as const,
    FETCH_NOT_ADDED_USER_TERMS_DONE: 'FETCH_NOT_ADDED_USER_TERMS_DONE' as const,
    FETCH_NOT_ADDED_USER_TERMS_FAILED:
        'FETCH_NOT_ADDED_USER_TERMS_FAILED' as const,
    FETCH_NOT_ADDED_USER_TERMS_INIT: 'FETCH_NOT_ADDED_USER_TERMS_INIT' as const,
    REMOVE_TERM_DONE: 'REMOVE_TERM_DONE' as const,
    REMOVE_TERM_FAILED: 'REMOVE_TERM_FAILED' as const,
    REMOVE_TERM_INIT: 'REMOVE_TERM_INIT' as const,
}

type UserTermsReducerAction =
    | {
          type:
              | typeof UserTermsActionType.FETCH_ADDED_USER_TERMS_INIT
              | typeof UserTermsActionType.FETCH_ADDED_USER_TERMS_FAILED
              | typeof UserTermsActionType.FETCH_NOT_ADDED_USER_TERMS_INIT
              | typeof UserTermsActionType.FETCH_NOT_ADDED_USER_TERMS_FAILED
      }
    | {
          type:
              | typeof UserTermsActionType.FETCH_ADDED_USER_TERMS_DONE
              | typeof UserTermsActionType.FETCH_NOT_ADDED_USER_TERMS_DONE
          payload: {
              data: UserTerm[]
              totalPages: number
          }
      }
    | {
          type:
              | typeof UserTermsActionType.ADD_TERM_DONE
              | typeof UserTermsActionType.ADD_TERM_INIT
              | typeof UserTermsActionType.ADD_TERM_FAILED
              | typeof UserTermsActionType.REMOVE_TERM_DONE
              | typeof UserTermsActionType.REMOVE_TERM_INIT
              | typeof UserTermsActionType.REMOVE_TERM_FAILED
          payload: string
      }

const reducer = (
    previousState: UserTermsState,
    action: UserTermsReducerAction,
): UserTermsState => {
    switch (action.type) {
        case UserTermsActionType.FETCH_ADDED_USER_TERMS_INIT: {
            return {
                ...previousState,
                addedDatas: [],
                isLoadingAddedTerm: true,
            }
        }

        case UserTermsActionType.FETCH_ADDED_USER_TERMS_DONE: {
            return {
                ...previousState,
                addedDatas: action.payload.data,
                addedTotalPage: action.payload.totalPages,
                isLoadingAddedTerm: false,
            }
        }

        case UserTermsActionType.FETCH_ADDED_USER_TERMS_FAILED: {
            return {
                ...previousState,
                isLoadingAddedTerm: false,
            }
        }

        case UserTermsActionType.FETCH_NOT_ADDED_USER_TERMS_INIT: {
            return {
                ...previousState,
                isLoadingNotAddedTerm: true,
                notAddedDatas: [],
            }
        }

        case UserTermsActionType.FETCH_NOT_ADDED_USER_TERMS_DONE: {
            return {
                ...previousState,
                isLoadingNotAddedTerm: false,
                notAddedDatas: action.payload.data,
                notAddedTotalPage: action.payload.totalPages,
            }
        }

        case UserTermsActionType.FETCH_NOT_ADDED_USER_TERMS_FAILED: {
            return {
                ...previousState,
                isLoadingNotAddedTerm: false,
            }
        }

        case UserTermsActionType.ADD_TERM_INIT: {
            return {
                ...previousState,
                isAdding: {
                    ...previousState.isAdding,
                    [action.payload]: true,
                },
            }
        }

        case UserTermsActionType.ADD_TERM_DONE: {
            return {
                ...previousState,
                isAdding: {
                    ...previousState.isAdding,
                    [action.payload]: false,
                },
            }
        }

        case UserTermsActionType.ADD_TERM_FAILED: {
            return {
                ...previousState,
                isAdding: {
                    ...previousState.isAdding,
                    [action.payload]: false,
                },
            }
        }

        case UserTermsActionType.REMOVE_TERM_INIT: {
            return {
                ...previousState,
                isRemoving: {
                    ...previousState.isRemoving,
                    [action.payload]: true,
                },
            }
        }

        case UserTermsActionType.REMOVE_TERM_DONE: {
            return {
                ...previousState,
                isRemoving: {
                    ...previousState.isRemoving,
                    [action.payload]: false,
                },
            }
        }

        case UserTermsActionType.REMOVE_TERM_FAILED: {
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

export interface useManageUserTermsProps {
    addedInfo: {
        datas: UserTerm[]
        doRemoveTerm: (termId: string) => void
        isLoadingTerm: boolean
        isRemoving: { [key: string]: boolean }
        page: number
        search: string
        setPage: Dispatch<SetStateAction<number>>
        setSearch: Dispatch<SetStateAction<string>>
        totalPage: number
    }
    notAddedInfo: {
        datas: UserTerm[]
        doAddTerm: (termId: string) => void
        isLoadingTerm: boolean
        isAdding: { [key: string]: boolean }
        page: number
        search: string
        setPage: Dispatch<SetStateAction<number>>
        setSearch: Dispatch<SetStateAction<string>>
        totalPage: number
    }
}

/**
 * Manage user terms redux state
 * @param userInfo user info
 * @returns state data
 */
export function useManageUserTerms(
    userInfo: UserInfo,
): useManageUserTermsProps {
    const [addedPage, setAddedPage] = useState(1)
    const [addedSearch, setAddedSearch] = useState('')
    const [notAddedPage, setNotAddedPage] = useState(1)
    const [notAddedSearch, setNotAddedSearch] = useState('')
    const [state, dispatch] = useReducer(reducer, {
        addedDatas: [],
        addedTotalPage: 1,
        isAdding: {},
        isLoadingAddedTerm: false,
        isLoadingNotAddedTerm: false,
        isRemoving: {},
        notAddedDatas: [],
        notAddedTotalPage: 1,
    })
    const addedTermRef = useRef({
        isLoading: false,
        page: 1,
        search: '',
    })
    const notAddedTermRef = useRef({
        isLoading: false,
        page: 1,
        search: '',
    })

    const doSearchAddedUserTerms = useCallback(() => {
        dispatch({
            type: UserTermsActionType.FETCH_ADDED_USER_TERMS_INIT,
        })
        // eslint-disable-next-line max-len
        let filter = `userId=${userInfo.id}&page=${addedTermRef.current.page}&perPage=${TABLE_USER_TEMRS_PAGINATION_ITEM_PER_PAGE}`
        const searchKey = addedTermRef.current.search
        if (searchKey && searchKey.trim()) {
            filter += `&title=${searchKey}`
        }

        addedTermRef.current.isLoading = true
        fetchAllTerms(filter)
            .then(result => {
                addedTermRef.current.isLoading = false
                dispatch({
                    payload: {
                        data: result.data.result,
                        totalPages: result.totalPages,
                    },
                    type: UserTermsActionType.FETCH_ADDED_USER_TERMS_DONE,
                })
            })
            .catch(e => {
                addedTermRef.current.isLoading = false
                dispatch({
                    type: UserTermsActionType.FETCH_ADDED_USER_TERMS_FAILED,
                })
                handleError(e)
            })
    }, [dispatch, userInfo])

    const doSearchNotAddedUserTerms = useCallback(() => {
        dispatch({
            type: UserTermsActionType.FETCH_NOT_ADDED_USER_TERMS_INIT,
        })
        let filter = `page=${notAddedTermRef.current.page}&perPage=${TABLE_USER_TEMRS_PAGINATION_ITEM_PER_PAGE}`
        const searchKey = notAddedTermRef.current.search
        if (searchKey && searchKey.trim()) {
            filter += `&title=${searchKey}`
        }

        notAddedTermRef.current.isLoading = true
        fetchAllTerms(filter)
            .then(result => {
                notAddedTermRef.current.isLoading = false
                dispatch({
                    payload: {
                        data: result.data.result,
                        totalPages: result.totalPages,
                    },
                    type: UserTermsActionType.FETCH_NOT_ADDED_USER_TERMS_DONE,
                })
            })
            .catch(e => {
                notAddedTermRef.current.isLoading = false
                dispatch({
                    type: UserTermsActionType.FETCH_NOT_ADDED_USER_TERMS_FAILED,
                })
                handleError(e)
            })
    }, [dispatch])

    const doAddTerm = useCallback(
        (termId: string) => {
            dispatch({
                payload: termId,
                type: UserTermsActionType.ADD_TERM_INIT,
            })
            addUserTerm(termId, userInfo.id)
                .then(() => {
                    toast.success('Term added successfully', {
                        toastId: 'Add term',
                    })
                    dispatch({
                        payload: termId,
                        type: UserTermsActionType.ADD_TERM_DONE,
                    })
                    doSearchAddedUserTerms()
                    doSearchNotAddedUserTerms()
                })
                .catch(e => {
                    dispatch({
                        payload: termId,
                        type: UserTermsActionType.ADD_TERM_FAILED,
                    })
                    handleError(e)
                })
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [dispatch, userInfo],
    )

    const doRemoveTerm = useCallback(
        (termId: string) => {
            dispatch({
                payload: termId,
                type: UserTermsActionType.REMOVE_TERM_INIT,
            })
            removeTermUser(termId, userInfo.id)
                .then(() => {
                    toast.success('Term removed successfully', {
                        toastId: 'Remove term',
                    })
                    dispatch({
                        payload: termId,
                        type: UserTermsActionType.REMOVE_TERM_DONE,
                    })
                    doSearchAddedUserTerms()
                    doSearchNotAddedUserTerms()
                })
                .catch(e => {
                    dispatch({
                        payload: termId,
                        type: UserTermsActionType.REMOVE_TERM_FAILED,
                    })
                    handleError(e)
                })
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [dispatch, userInfo],
    )

    useEffect(() => {
        if (!addedTermRef.current.isLoading) {
            addedTermRef.current.page = 1
            addedTermRef.current.search = addedSearch
            setAddedPage(1)
            doSearchAddedUserTerms()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [addedSearch])

    useEffect(() => {
        if (!addedTermRef.current.isLoading) {
            addedTermRef.current.page = addedPage
            doSearchAddedUserTerms()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [addedPage])

    useEffect(() => {
        if (!notAddedTermRef.current.isLoading) {
            notAddedTermRef.current.page = 1
            notAddedTermRef.current.search = notAddedSearch
            setNotAddedPage(1)
            doSearchNotAddedUserTerms()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [notAddedSearch])

    useEffect(() => {
        if (!notAddedTermRef.current.isLoading) {
            notAddedTermRef.current.page = notAddedPage
            doSearchNotAddedUserTerms()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [notAddedPage])

    return {
        addedInfo: {
            datas: state.addedDatas,
            doRemoveTerm,
            isLoadingTerm: state.isLoadingAddedTerm,
            isRemoving: state.isRemoving,
            page: addedPage,
            search: addedSearch,
            setPage: setAddedPage,
            setSearch: setAddedSearch,
            totalPage: state.addedTotalPage,
        },
        notAddedInfo: {
            datas: state.notAddedDatas,
            doAddTerm,
            isAdding: state.isAdding,
            isLoadingTerm: state.isLoadingNotAddedTerm,
            page: notAddedPage,
            search: notAddedSearch,
            setPage: setNotAddedPage,
            setSearch: setNotAddedSearch,
            totalPage: state.notAddedTotalPage,
        },
    }
}
