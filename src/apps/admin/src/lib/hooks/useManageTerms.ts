/**
 * Manage terms redux state
 */
import { Dispatch, SetStateAction, useReducer } from 'react'

import { TABLE_PAGINATION_ITEM_PER_PAGE } from '../../config/index.config'
import { FormSearchByKey, UserTerm } from '../models'
import { handleError } from '../utils'
import { fetchAllTerms } from '../services'

import {
    useTableFilterBackend,
    useTableFilterBackendProps,
} from './useTableFilterBackend'

/// /////////////////
// Terms reducer
/// ////////////////

type TermsState = {
    isLoading: boolean
    datas: UserTerm[]
    totalPages: number
}

const TermsActionType = {
    FETCH_TERMS_DONE: 'FETCH_TERMS_DONE' as const,
    FETCH_TERMS_FAILED: 'FETCH_TERMS_FAILED' as const,
    FETCH_TERMS_INIT: 'FETCH_TERMS_INIT' as const,
}

type TermsReducerAction =
    | {
          type:
              | typeof TermsActionType.FETCH_TERMS_INIT
              | typeof TermsActionType.FETCH_TERMS_FAILED
      }
    | {
          type: typeof TermsActionType.FETCH_TERMS_DONE
          payload: {
              data: UserTerm[]
              totalPages: number
          }
      }

const reducer = (
    previousState: TermsState,
    action: TermsReducerAction,
): TermsState => {
    switch (action.type) {
        case TermsActionType.FETCH_TERMS_INIT: {
            return {
                ...previousState,
                datas: [],
                isLoading: true,
            }
        }

        case TermsActionType.FETCH_TERMS_DONE: {
            return {
                ...previousState,
                datas: action.payload.data,
                isLoading: false,
                totalPages: action.payload.totalPages,
            }
        }

        case TermsActionType.FETCH_TERMS_FAILED: {
            return {
                ...previousState,
                isLoading: false,
            }
        }

        default: {
            return previousState
        }
    }
}

export interface useManageTermsProps {
    datas: UserTerm[]
    isLoading: boolean
    page: number
    setPage: Dispatch<SetStateAction<number>>
    setFilterCriteria: (criteria: FormSearchByKey | undefined) => void
    totalPages: number
}

/**
 * Manage terms redux state
 *
 * @returns state data
 */
export function useManageTerms(): useManageTermsProps {
    const [state, dispatch] = useReducer(reducer, {
        datas: [],
        isLoading: false,
        totalPages: 1,
    })

    /**
     * Manage backend pagination, filtering
     */
    const {
        page,
        setPage,
        setFilterCriteria,
    }: useTableFilterBackendProps<FormSearchByKey>
        = useTableFilterBackend<FormSearchByKey>(
            (pagRequest, sortRequest, filterCriteria, success, fail) => {
                dispatch({
                    type: TermsActionType.FETCH_TERMS_INIT,
                })
                let filter = `page=${pagRequest}&perPage=${TABLE_PAGINATION_ITEM_PER_PAGE}`
                if (filterCriteria?.searchKey) {
                    filter += `&title=${filterCriteria?.searchKey}`
                }

                fetchAllTerms(filter)
                    .then(result => {
                        dispatch({
                            payload: {
                                data: result.data.result,
                                totalPages: result.totalPages,
                            },
                            type: TermsActionType.FETCH_TERMS_DONE,
                        })
                        success()
                        window.scrollTo({ left: 0, top: 0 })
                    })
                    .catch(e => {
                        dispatch({
                            type: TermsActionType.FETCH_TERMS_FAILED,
                        })
                        handleError(e)
                        fail()
                    })
            },
            {
                searchKey: '',
            },
        )

    return {
        datas: state.datas,
        isLoading: state.isLoading,
        page,
        setFilterCriteria,
        setPage,
        totalPages: state.totalPages,
    }
}
