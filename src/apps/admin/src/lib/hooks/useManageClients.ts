/**
 * Manage clients redux state
 */
import {
    Dispatch,
    SetStateAction,
    useReducer,
} from 'react'

import { Sort } from '~/apps/admin/src/platform/gamification-admin/src/game-lib'

import { TABLE_PAGINATION_ITEM_PER_PAGE } from '../../config/index.config'
import { ClientInfo, FormClientsFilter } from '../models'
import { handleError } from '../utils'
import { searchClients } from '../services'

import { useTableFilterBackend, useTableFilterBackendProps } from './useTableFilterBackend'

/// /////////////////
// Clients reducer
/// ////////////////

type ClientsState = {
    isLoading: boolean
    datas: ClientInfo[]
    totalPages: number
}

const ClientsActionType = {
    FETCH_BILLING_ACCOUNTS_DONE: 'FETCH_BILLING_ACCOUNTS_DONE' as const,
    FETCH_BILLING_ACCOUNTS_FAILED: 'FETCH_BILLING_ACCOUNTS_FAILED' as const,
    FETCH_BILLING_ACCOUNTS_INIT: 'FETCH_BILLING_ACCOUNTS_INIT' as const,
}

type ClientsReducerAction =
    | {
          type:
              | typeof ClientsActionType.FETCH_BILLING_ACCOUNTS_INIT
              | typeof ClientsActionType.FETCH_BILLING_ACCOUNTS_FAILED
      }
    | {
          type: typeof ClientsActionType.FETCH_BILLING_ACCOUNTS_DONE
          payload: {
              data: ClientInfo[]
              totalPages: number
          }
      }

const reducer = (
    previousState: ClientsState,
    action: ClientsReducerAction,
): ClientsState => {
    switch (action.type) {
        case ClientsActionType.FETCH_BILLING_ACCOUNTS_INIT: {
            return {
                ...previousState,
                datas: [],
                isLoading: true,
            }
        }

        case ClientsActionType.FETCH_BILLING_ACCOUNTS_DONE: {
            return {
                ...previousState,
                datas: action.payload.data,
                isLoading: false,
                totalPages: action.payload.totalPages,
            }
        }

        case ClientsActionType.FETCH_BILLING_ACCOUNTS_FAILED: {
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

export interface useManageClientsProps {
    datas: ClientInfo[]
    isLoading: boolean
    page: number
    setPage: Dispatch<SetStateAction<number>>
    setFilterCriteria: (criteria: FormClientsFilter | undefined) => void
    sort: Sort | undefined
    setSort: Dispatch<SetStateAction<Sort | undefined>>
    totalPages: number
    reloadData?: () => void
}

/**
 * Manage clients redux state
 * @param mappingSortField mapping from property field to sort field
 * @returns state data
 */
export function useManageClients(mappingSortField?: {
    [key: string]: string
}): useManageClientsProps {
    const [state, dispatch] = useReducer(reducer, {
        datas: [],
        isLoading: false,
        totalPages: 1,
    })
    const {
        page,
        setPage,
        setFilterCriteria,
        sort,
        setSort,
        reloadData,
    }: useTableFilterBackendProps<FormClientsFilter>
        = useTableFilterBackend<FormClientsFilter>(
            (pagRequest, sortRequest, filterCriteria, success, fail) => {
                dispatch({
                    type: ClientsActionType.FETCH_BILLING_ACCOUNTS_INIT,
                })
                let sortFieldName = sortRequest?.fieldName
                if (
                    mappingSortField
                    && sortFieldName
                    && mappingSortField[sortFieldName]
                ) {
                    sortFieldName = mappingSortField[sortFieldName]
                }

                searchClients(
                    filterCriteria
                        ? {
                            ...(filterCriteria.startDate
                                ? {
                                    endDateFrom: filterCriteria.startDate,
                                    startDateFrom: filterCriteria.startDate,
                                }
                                : {}),
                            ...(filterCriteria.endDate
                                ? {
                                    endDateTo: filterCriteria.endDate,
                                    startDateTo: filterCriteria.endDate,
                                }
                                : {}),
                            name: filterCriteria.name,
                            status: filterCriteria.status,
                        }
                        : {},
                    {
                        limit: TABLE_PAGINATION_ITEM_PER_PAGE,
                        page: pagRequest,
                        sort: sortRequest ? `${sortFieldName} ${sortRequest.direction}` : '',
                    },
                )
                    .then(result => {
                        dispatch({
                            payload: {
                                data: result.content,
                                totalPages: result.totalPages,
                            },
                            type: ClientsActionType.FETCH_BILLING_ACCOUNTS_DONE,
                        })
                        success()
                    })
                    .catch(e => {
                        dispatch({
                            type: ClientsActionType.FETCH_BILLING_ACCOUNTS_FAILED,
                        })
                        handleError(e)
                        fail()
                    })
            },
            {
                status: 'ACTIVE',
            },
        )

    return {
        datas: state.datas,
        isLoading: state.isLoading,
        page,
        reloadData,
        setFilterCriteria,
        setPage,
        setSort,
        sort,
        totalPages: state.totalPages,
    }
}
