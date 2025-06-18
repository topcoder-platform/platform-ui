/**
 * Manage add billing account resource redux state
 */
import { useCallback, useReducer, useRef } from 'react'
import { toast } from 'react-toastify'

import { FormNewBillingAccountResource, UserInfo } from '../models'
import {
    createBillingAccountResource,
    searchUsers,
} from '../services'
import { handleError } from '../utils'

/// /////////////////
// Add billing account resource reducer
/// ////////////////

type AddBillingAccountResourceState = {
    isLoading: boolean
    isAdding: boolean
    userInfo?: UserInfo
}

const AddBillingAccountResourceActionType = {
    ADD_BILLING_ACCOUNT_RESOURCE_DONE:
        'ADD_BILLING_ACCOUNT_RESOURCE_DONE' as const,
    ADD_BILLING_ACCOUNT_RESOURCE_FAILED:
        'ADD_BILLING_ACCOUNT_RESOURCE_FAILED' as const,
    ADD_BILLING_ACCOUNT_RESOURCE_INIT:
        'ADD_BILLING_ACCOUNT_RESOURCE_INIT' as const,
    FETCHING_USER_INFO_DONE: 'FETCHING_USER_INFO_DONE' as const,
    FETCHING_USER_INFO_FAILED: 'FETCHING_USER_INFO_FAILED' as const,
    FETCHING_USER_INFO_INIT: 'FETCHING_USER_INFO_INIT' as const,
}

type AddBillingAccountResourceReducerAction =
    | {
          type:
              | typeof AddBillingAccountResourceActionType.ADD_BILLING_ACCOUNT_RESOURCE_DONE
              | typeof AddBillingAccountResourceActionType.ADD_BILLING_ACCOUNT_RESOURCE_INIT
              | typeof AddBillingAccountResourceActionType.ADD_BILLING_ACCOUNT_RESOURCE_FAILED
              | typeof AddBillingAccountResourceActionType.FETCHING_USER_INFO_INIT
              | typeof AddBillingAccountResourceActionType.FETCHING_USER_INFO_FAILED
      }
    | {
          type: typeof AddBillingAccountResourceActionType.FETCHING_USER_INFO_DONE
          payload: UserInfo
      }

const reducer = (
    previousState: AddBillingAccountResourceState,
    action: AddBillingAccountResourceReducerAction,
): AddBillingAccountResourceState => {
    switch (action.type) {
        case AddBillingAccountResourceActionType.FETCHING_USER_INFO_INIT: {
            return {
                ...previousState,
                isLoading: true,
            }
        }

        case AddBillingAccountResourceActionType.FETCHING_USER_INFO_DONE: {
            return {
                ...previousState,
                isLoading: false,
                userInfo: action.payload,
            }
        }

        case AddBillingAccountResourceActionType.FETCHING_USER_INFO_FAILED: {
            return {
                ...previousState,
                isLoading: false,
                userInfo: undefined,
            }
        }

        case AddBillingAccountResourceActionType.ADD_BILLING_ACCOUNT_RESOURCE_INIT: {
            return {
                ...previousState,
                isAdding: true,
            }
        }

        case AddBillingAccountResourceActionType.ADD_BILLING_ACCOUNT_RESOURCE_DONE: {
            return {
                ...previousState,
                isAdding: false,
            }
        }

        case AddBillingAccountResourceActionType.ADD_BILLING_ACCOUNT_RESOURCE_FAILED: {
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

export interface useManageAddBillingAccountResourceProps {
    isLoading: boolean
    isAdding: boolean
    userInfo?: UserInfo
    doAddBillingAccountResource: (
        data: FormNewBillingAccountResource,
        callBack: () => void,
    ) => void
    doSearchUserInfo: (handle: string) => void
}

/**
 * Manage add billing account resource redux state
 * @param accountId billing account id
 * @returns state data
 */
export function useManageAddBillingAccountResource(
    accountId: string,
): useManageAddBillingAccountResourceProps {
    const [state, dispatch] = useReducer(reducer, {
        isAdding: false,
        isLoading: false,
    })
    const isLoadingRef = useRef(false)

    const doSearchUserInfo = useCallback(
        (handle: string) => {
            function handleErrorResult(e: any): void {
                isLoadingRef.current = false
                dispatch({
                    type: AddBillingAccountResourceActionType.FETCHING_USER_INFO_FAILED,
                })
                handleError(e)
            }

            if (handle && handle !== state.userInfo?.handle) {
                dispatch({
                    type: AddBillingAccountResourceActionType.FETCHING_USER_INFO_INIT,
                })
                isLoadingRef.current = true

                searchUsers({
                    filter: `handle=${handle}`,
                })
                    .then(result => {
                        if (result && result.length) {
                            isLoadingRef.current = false
                            dispatch({
                                payload: result[0],
                                type: AddBillingAccountResourceActionType.FETCHING_USER_INFO_DONE,
                            })
                        } else {
                            handleErrorResult({
                                message: `Can not find ID with handle : ${handle}`,
                            })
                        }
                    })
                    .catch(handleErrorResult)
            }
        },
        [dispatch, state.userInfo],
    )

    const doAddBillingAccountResource = useCallback(
        (data: FormNewBillingAccountResource, callBack: () => void) => {
            dispatch({
                type: AddBillingAccountResourceActionType.ADD_BILLING_ACCOUNT_RESOURCE_INIT,
            })
            createBillingAccountResource(accountId, data)
                .then(() => {
                    toast.success(
                        'Account billing resource added successfully',
                        {
                            toastId: 'Add account billing resource',
                        },
                    )
                    callBack()
                    dispatch({
                        type: AddBillingAccountResourceActionType.ADD_BILLING_ACCOUNT_RESOURCE_DONE,
                    })
                })
                .catch(e => {
                    dispatch({
                        type: AddBillingAccountResourceActionType.ADD_BILLING_ACCOUNT_RESOURCE_FAILED,
                    })
                    handleError(e)
                })
        },
        [dispatch, accountId],
    )

    return {
        doAddBillingAccountResource,
        doSearchUserInfo,
        isAdding: state.isAdding,
        isLoading: state.isLoading,
        userInfo: state.userInfo,
    }
}
