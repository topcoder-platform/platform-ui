/**
 * Manage billing accounts redux state
 */
import {
    Dispatch,
    SetStateAction,
    useReducer,
} from 'react'

import { Sort } from '~/apps/admin/src/platform/gamification-admin/src/game-lib'

import { TABLE_PAGINATION_ITEM_PER_PAGE } from '../../config/index.config'
import { BillingAccount, FormBillingAccountsFilter } from '../models'
import { searchBillingAccounts } from '../services'
import { handleError } from '../utils'

import { useTableFilterBackend, useTableFilterBackendProps } from './useTableFilterBackend'

/// /////////////////
// Billing accounts reducer
/// ////////////////

type BillingAccountsState = {
    isLoading: boolean
    datas: BillingAccount[]
    totalPages: number
}

const BillingAccountsActionType = {
    FETCH_BILLING_ACCOUNTS_DONE: 'FETCH_BILLING_ACCOUNTS_DONE' as const,
    FETCH_BILLING_ACCOUNTS_FAILED: 'FETCH_BILLING_ACCOUNTS_FAILED' as const,
    FETCH_BILLING_ACCOUNTS_INIT: 'FETCH_BILLING_ACCOUNTS_INIT' as const,
}

type BillingAccountsReducerAction =
    | {
          type:
              | typeof BillingAccountsActionType.FETCH_BILLING_ACCOUNTS_INIT
              | typeof BillingAccountsActionType.FETCH_BILLING_ACCOUNTS_FAILED
      }
    | {
          type: typeof BillingAccountsActionType.FETCH_BILLING_ACCOUNTS_DONE
          payload: {
              data: BillingAccount[]
              totalPages: number
          }
      }

const reducer = (
    previousState: BillingAccountsState,
    action: BillingAccountsReducerAction,
): BillingAccountsState => {
    switch (action.type) {
        case BillingAccountsActionType.FETCH_BILLING_ACCOUNTS_INIT: {
            return {
                ...previousState,
                datas: [],
                isLoading: true,
            }
        }

        case BillingAccountsActionType.FETCH_BILLING_ACCOUNTS_DONE: {
            return {
                ...previousState,
                datas: action.payload.data,
                isLoading: false,
                totalPages: action.payload.totalPages,
            }
        }

        case BillingAccountsActionType.FETCH_BILLING_ACCOUNTS_FAILED: {
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

export interface useManageBillingAccountsProps {
    datas: BillingAccount[]
    isLoading: boolean
    page: number
    setPage: Dispatch<SetStateAction<number>>
    setFilterCriteria: (criteria: FormBillingAccountsFilter | undefined) => void
    sort: Sort | undefined
    setSort: Dispatch<SetStateAction<Sort | undefined>>
    totalPages: number
}

/**
 * Manage billing accounts redux state
 * @param mappingSortField mapping from property field to sort field
 * @returns state data
 */
export function useManageBillingAccounts(mappingSortField?: {
    [key: string]: string
}): useManageBillingAccountsProps {
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
    }: useTableFilterBackendProps<FormBillingAccountsFilter>
        = useTableFilterBackend<FormBillingAccountsFilter>(
            (pageRequest, sortRequest, filterCriteria, success, fail) => {
                dispatch({
                    type: BillingAccountsActionType.FETCH_BILLING_ACCOUNTS_INIT,
                })
                let sortFieldName = sortRequest?.fieldName
                if (
                    mappingSortField
                    && sortFieldName
                    && mappingSortField[sortFieldName]
                ) {
                    sortFieldName = mappingSortField[sortFieldName]
                }

                searchBillingAccounts(
                    filterCriteria
                        ? {
                            endDate: filterCriteria.endDate,
                            name: filterCriteria.name,
                            startDate: filterCriteria.startDate,
                            status: filterCriteria.status,
                            user: filterCriteria.user,
                        }
                        : {},
                    {
                        limit: TABLE_PAGINATION_ITEM_PER_PAGE,
                        page: pageRequest,
                        sort: sortRequest ? `${sortFieldName} ${sortRequest.direction}` : '',
                    },
                )
                    .then(result => {
                        dispatch({
                            payload: {
                                data: result.content,
                                totalPages: result.totalPages,
                            },
                            type: BillingAccountsActionType.FETCH_BILLING_ACCOUNTS_DONE,
                        })
                        success()
                    })
                    .catch(e => {
                        dispatch({
                            type: BillingAccountsActionType.FETCH_BILLING_ACCOUNTS_FAILED,
                        })
                        handleError(e)
                        fail()
                    })
            },
            {
                status: '1',
            },
        )

    return {
        datas: state.datas,
        isLoading: state.isLoading,
        page,
        setFilterCriteria,
        setPage,
        setSort,
        sort,
        totalPages: state.totalPages,
    }
}
