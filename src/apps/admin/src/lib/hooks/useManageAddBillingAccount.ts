/**
 * Manage add/edit billing account redux state
 */
import { useCallback, useEffect, useReducer, useRef } from 'react'
import { toast } from 'react-toastify'

import { handleError } from '../utils'
import { BillingAccount, ClientInfo, FormEditBillingAccount } from '../models'
import {
    createBillingAccount,
    editBillingAccount,
    findBillingAccountById,
    findClientById,
} from '../services'

/// /////////////////
// Add/Edit billing account reducer
/// ////////////////

type BillingAccountsState = {
    isLoading: boolean
    isAdding: boolean
    isUpdating: boolean
    billingAccount?: BillingAccount
}

const BillingAccountsActionType = {
    ADD_BILLING_ACCOUNT_DONE: 'ADD_BILLING_ACCOUNT_DONE' as const,
    ADD_BILLING_ACCOUNT_FAILED: 'ADD_BILLING_ACCOUNT_FAILED' as const,
    ADD_BILLING_ACCOUNT_INIT: 'ADD_BILLING_ACCOUNT_INIT' as const,
    FETCH_BILLING_ACCOUNT_DONE: 'FETCH_BILLING_ACCOUNT_DONE' as const,
    FETCH_BILLING_ACCOUNT_FAILED: 'FETCH_BILLING_ACCOUNT_FAILED' as const,
    FETCH_BILLING_ACCOUNT_INIT: 'FETCH_BILLING_ACCOUNT_INIT' as const,
    UPDATE_BILLING_ACCOUNT_DONE: 'UPDATE_BILLING_ACCOUNT_DONE' as const,
    UPDATE_BILLING_ACCOUNT_FAILED: 'UPDATE_BILLING_ACCOUNT_FAILED' as const,
    UPDATE_BILLING_ACCOUNT_INIT: 'UPDATE_BILLING_ACCOUNT_INIT' as const,
}

type BillingAccountsReducerAction =
    | {
          type:
              | typeof BillingAccountsActionType.ADD_BILLING_ACCOUNT_DONE
              | typeof BillingAccountsActionType.ADD_BILLING_ACCOUNT_INIT
              | typeof BillingAccountsActionType.ADD_BILLING_ACCOUNT_FAILED
              | typeof BillingAccountsActionType.FETCH_BILLING_ACCOUNT_INIT
              | typeof BillingAccountsActionType.FETCH_BILLING_ACCOUNT_FAILED
              | typeof BillingAccountsActionType.UPDATE_BILLING_ACCOUNT_DONE
              | typeof BillingAccountsActionType.UPDATE_BILLING_ACCOUNT_INIT
              | typeof BillingAccountsActionType.UPDATE_BILLING_ACCOUNT_FAILED
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

        case BillingAccountsActionType.ADD_BILLING_ACCOUNT_INIT: {
            return {
                ...previousState,
                isAdding: true,
            }
        }

        case BillingAccountsActionType.ADD_BILLING_ACCOUNT_DONE: {
            return {
                ...previousState,
                isAdding: false,
            }
        }

        case BillingAccountsActionType.ADD_BILLING_ACCOUNT_FAILED: {
            return {
                ...previousState,
                isAdding: false,
            }
        }

        case BillingAccountsActionType.UPDATE_BILLING_ACCOUNT_INIT: {
            return {
                ...previousState,
                isUpdating: true,
            }
        }

        case BillingAccountsActionType.UPDATE_BILLING_ACCOUNT_DONE: {
            return {
                ...previousState,
                isUpdating: false,
            }
        }

        case BillingAccountsActionType.UPDATE_BILLING_ACCOUNT_FAILED: {
            return {
                ...previousState,
                isUpdating: false,
            }
        }

        default: {
            return previousState
        }
    }
}

export interface useManageAddBillingAccountProps {
    isLoading: boolean
    isAdding: boolean
    isUpdating: boolean
    billingAccount?: BillingAccount
    doAddBillingAccount: (
        data: FormEditBillingAccount,
        callBack: () => void,
    ) => void
    doUpdateBillingAccount: (
        data: FormEditBillingAccount,
        callBack: () => void,
    ) => void
}

/**
 * Manage add/edit billing account redux state
 * @param accountId account id
 * @returns state data
 */
export function useManageAddBillingAccount(
    accountId: string,
): useManageAddBillingAccountProps {
    const [state, dispatch] = useReducer(reducer, {
        isAdding: false,
        isLoading: false,
        isUpdating: false,
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
                if (result.clientId) {
                    findClientById(result.clientId)
                        .then((data: ClientInfo) => {
                            handleSuccessResult({
                                ...result,
                                client: data,
                            })
                        })
                        .catch(handleErrorResult)
                } else {
                    handleSuccessResult(result)
                }
            })
            .catch(handleErrorResult)
    }, [dispatch, accountId])

    const doAddBillingAccount = useCallback(
        (data: FormEditBillingAccount, callBack: () => void) => {
            dispatch({
                type: BillingAccountsActionType.ADD_BILLING_ACCOUNT_INIT,
            })
            createBillingAccount(data)
                .then(() => {
                    toast.success('Billing account added successfully', {
                        toastId: 'Add accounts',
                    })
                    dispatch({
                        type: BillingAccountsActionType.ADD_BILLING_ACCOUNT_DONE,
                    })
                    callBack()
                })
                .catch(e => {
                    dispatch({
                        type: BillingAccountsActionType.ADD_BILLING_ACCOUNT_FAILED,
                    })
                    handleError(e)
                })
        },
        [dispatch],
    )

    const doUpdateBillingAccount = useCallback(
        (data: FormEditBillingAccount, callBack: () => void) => {
            dispatch({
                type: BillingAccountsActionType.UPDATE_BILLING_ACCOUNT_INIT,
            })
            editBillingAccount(accountId, data)
                .then(() => {
                    toast.success('Billing account updated successfully', {
                        toastId: 'Update accounts',
                    })
                    dispatch({
                        type: BillingAccountsActionType.UPDATE_BILLING_ACCOUNT_DONE,
                    })
                    callBack()
                })
                .catch(e => {
                    dispatch({
                        type: BillingAccountsActionType.UPDATE_BILLING_ACCOUNT_FAILED,
                    })
                    handleError(e)
                })
        },
        [dispatch, accountId],
    )

    useEffect(() => {
        if (accountId) {
            doFetchBillingAccount()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accountId])

    return {
        billingAccount: state.billingAccount,
        doAddBillingAccount,
        doUpdateBillingAccount,
        isAdding: state.isAdding,
        isLoading: state.isLoading,
        isUpdating: state.isUpdating,
    }
}
