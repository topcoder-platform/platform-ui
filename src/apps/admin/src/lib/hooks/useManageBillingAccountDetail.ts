/**
 * Manage billing account detail redux state
 */
import { useCallback, useEffect, useReducer, useRef } from 'react'

import { handleError } from '../utils'
import { BillingAccount } from '../models'
import {
    findBillingAccountById,
} from '../services'

/// /////////////////
//  Billing account detail reducer
/// ////////////////

type BillingAccountsState = {
    isLoading: boolean
    billingAccount?: BillingAccount
}

const BillingAccountsActionType = {
    FETCH_BILLING_ACCOUNT_DONE: 'FETCH_BILLING_ACCOUNT_DONE' as const,
    FETCH_BILLING_ACCOUNT_FAILED: 'FETCH_BILLING_ACCOUNT_FAILED' as const,
    FETCH_BILLING_ACCOUNT_INIT: 'FETCH_BILLING_ACCOUNT_INIT' as const,
}

type BillingAccountsReducerAction =
    | {
          type:
              | typeof BillingAccountsActionType.FETCH_BILLING_ACCOUNT_INIT
              | typeof BillingAccountsActionType.FETCH_BILLING_ACCOUNT_FAILED
      }
    | {
          type: typeof BillingAccountsActionType.FETCH_BILLING_ACCOUNT_DONE
          payload: BillingAccount
      }

const reducer = (
    previousState: BillingAccountsState,
    action: BillingAccountsReducerAction,
): BillingAccountsState => {
    switch (action.type) {
        case BillingAccountsActionType.FETCH_BILLING_ACCOUNT_INIT: {
            return {
                ...previousState,
                isLoading: true,
            }
        }

        case BillingAccountsActionType.FETCH_BILLING_ACCOUNT_DONE: {
            const billingAccount = action.payload
            return {
                ...previousState,
                billingAccount,
                isLoading: false,
            }
        }

        case BillingAccountsActionType.FETCH_BILLING_ACCOUNT_FAILED: {
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

export interface useManageBillingAccountDetailProps {
    isLoading: boolean
    billingAccount?: BillingAccount
}

/**
 * Manage billing account detail redux state
 * @param accountId account id
 * @returns state data
 */
export function useManageBillingAccountDetail(
    accountId: string,
): useManageBillingAccountDetailProps {
    const [state, dispatch] = useReducer(reducer, {
        isLoading: false,
    })
    const isLoadingRef = useRef(false)

    const doFetchBillingAccount = useCallback(() => {
        if (isLoadingRef.current) {
            return
        }

        dispatch({
            type: BillingAccountsActionType.FETCH_BILLING_ACCOUNT_INIT,
        })
        isLoadingRef.current = true

        function handleErrorResult(e: any): void {
            isLoadingRef.current = false
            dispatch({
                type: BillingAccountsActionType.FETCH_BILLING_ACCOUNT_FAILED,
            })
            handleError(e)
        }

        function handleSuccessResult(result: BillingAccount): void {
            isLoadingRef.current = false
            dispatch({
                payload: result,
                type: BillingAccountsActionType.FETCH_BILLING_ACCOUNT_DONE,
            })
        }

        findBillingAccountById(accountId)
            .then(result => {
                handleSuccessResult(result)
            })
            .catch(handleErrorResult)
    }, [dispatch, accountId])

    useEffect(() => {
        if (accountId) {
            doFetchBillingAccount()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accountId])

    return {
        billingAccount: state.billingAccount,
        isLoading: state.isLoading,
    }
}
